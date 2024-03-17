import bcrypt from 'bcrypt'
import HTTP_STATUS from '~/constants/httpStatus'
import { PRODUCTS_MESSAGE, USER_MESSAGE } from '~/constants/message'
import Colors from '~/models/Colors.models'
import Products from '~/models/Products.model'
import Sizes from '~/models/Sizes.model'
import Users from '~/models/Users.model'
import { generateToken } from '~/utils/jwt'

export const createUserController = async (req, res) => {
  try {
    const { full_name, email, password, confirm_password, phone } = req.body

    // Kiểm tra đầu vào cơ bản
    if (!email || !password || !confirm_password || !full_name || !phone) {
      return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
        message: PRODUCTS_MESSAGE.PRODUCTS_IS_REQUIRED
      })
    }

    // Kiểm tra định dạng email
    const reg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/
    if (!reg.test(email)) {
      return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
        message: USER_MESSAGE.VALIDATE_EMAIL
      })
    }

    if (password !== confirm_password) {
      return res.status(400).json({
        message: USER_MESSAGE.VALIDATE_PASSWORD
      })
    }

    const checkUser = await Users.findOne({ email: email })
    if (checkUser) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: USER_MESSAGE.EMAIL_ALREADY_EXISTS
      })
    }

    // Mã hóa mật khẩu
    const hash = bcrypt.hashSync(password, 10)

    // Tạo người dùng mới
    const createdUser = await Users.create({
      full_name,
      email,
      password: hash,
      phone
    })

    // Trả về thông tin người dùng mới nếu tạo thành công
    return res.status(HTTP_STATUS.OK).json({
      message: USER_MESSAGE.USER_CREATE,
      createdUser
    })
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: USER_MESSAGE.USER_CREATE_FAILED
    })
  }
}

export const signInController = async (req, res) => {
  try {
    const { email, password } = req.body
    const reg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/
    if (!reg.test(email)) {
      return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
        message: USER_MESSAGE.VALIDATE_EMAIL
      })
    }
    if (!email || !password) {
      return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
        message: PRODUCTS_MESSAGE.PRODUCTS_IS_REQUIRED
      })
    }
    // Bước 2: Kiểm tra xem email có trong db hay không?
    const user = await Users.findOne({ email: req.body.email })
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: USER_MESSAGE.USER_NOT_FOUND
      })
    }

    const userObject = user.toObject()
    delete userObject.password
    delete userObject.role
    // Bước 3: Kiểm tra password
    const isMatch = await bcrypt.compare(req.body.password, user.password)
    if (!isMatch) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: USER_MESSAGE.USER_NOT_FOUND
      })
    }
    //tạo access_token
    const access_token = generateToken({
      id: user._id,
      secret_code: process.env.SECRET_KEY_USER,
      expiresIn: '1d'
    })

    return res.status(HTTP_STATUS.OK).json({
      message: USER_MESSAGE.USER_LOGIN_SUCCESS,
      access_token,
      userObject
    })
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: error.message
    })
  }
}

export const addToCartController = async (req, res) => {
  const { _id } = req.user
  let { product_id, color_id, size_id } = req.body

  try {
    const product = await Products.findById(product_id).populate(['colors', 'sizes'])
    const user = await Users.findById(_id)

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ message: USER_MESSAGE.USER_NOT_FOUND })
    }

    if (!color_id && product.colors.length > 0) {
      color_id = product.colors[0]._id?.toString()
    }
    if (!size_id && product.sizes.length > 0) {
      size_id = product.sizes[0]._id?.toString()
    }

    let itemIndex = user.cart.findIndex(
      (item) =>
        item.product?.toString() === product_id &&
        item.color?.toString() === color_id &&
        item.size?.toString() === size_id
    )

    if (itemIndex > -1) {
      user.cart[itemIndex].quantity += 1
    } else {
      user.cart.push({
        product: product_id,
        color: color_id,
        size: size_id,
        quantity: 1
      })
    }
    await user.save()
    res.status(HTTP_STATUS.OK).json({
      message: 'Đã thêm sản phẩm vào giỏ hàng'
    })
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng'
    })
  }
}

export const getCurrentUserController = async (req, res) => {
  const { _id } = req.user
  try {
    const user = await Users.findById(_id).populate({
      path: 'cart.product',
      select: '-createdAt -updatedAt -refresh_token -password',
      populate: {
        path: 'category',
        select: 'title _id'
      }
    })
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ message: USER_MESSAGE.USER_NOT_FOUND })
    }
    // Tùy chỉnh thông tin sản phẩm trong giỏ hàng
    const customizedCart = await Promise.all(
      user.cart.map(async (item) => {
        const color = item.color ? await Colors.findById(item.color).select('name _id') : null
        const size = item.size ? await Sizes.findById(item.size).select('name _id') : null
        return {
          ...item._doc,
          product: {
            ...item.product._doc,
            category: item.product.category ? item.product.category.title : null,
            colors: color ? [{ name: color.name, _id: color._id }] : [],
            sizes: size ? [{ name: size.name, _id: size._id }] : []
          }
        }
      })
    )

    const userResponse = user.toObject()
    delete userResponse.password
    delete userResponse.refresh_token

    // Cập nhật giỏ hàng trong đối tượng người dùng
    userResponse.cart = customizedCart

    // Trả về thông tin người dùng bao gồm giỏ hàng đã được tùy chỉnh
    res.status(HTTP_STATUS.OK).json({
      message: 'Thông tin người dùng lấy thành công',
      user: userResponse
    })
  } catch (error) {
    console.error(error)
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Có lỗi xảy ra khi lấy thông tin người dùng và giỏ hàng'
    })
  }
}

export const updateCartItemController = async (req, res) => {
  const { _id } = req.user
  const { product_id, color_id, size_id, quantity } = req.body
  if (!quantity) {
    return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
      message: PRODUCTS_MESSAGE.PRODUCTS_IS_REQUIRED
    })
  }
  try {
    const user = await Users.findById(_id)
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ message: USER_MESSAGE.USER_NOT_FOUND })
    }

    const itemIndex = user.cart.findIndex(
      (item) =>
        item.product.toString() === product_id &&
        (!color_id || item.color.toString() === color_id) &&
        (!size_id || item.size.toString() === size_id)
    )

    if (itemIndex > -1) {
      if (quantity > 0) {
        user.cart[itemIndex].quantity = quantity
      } else {
        user.cart.splice(itemIndex, 1)
      }
      //lưu lại vào đb
      await user.save()
      res.status(HTTP_STATUS.OK).json({
        message: 'Giỏ hàng đã được cập nhật thành công',
        cart: user.cart
      })
    } else {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        message: 'Sản phẩm không tìm thấy trong giỏ hàng'
      })
    }
  } catch (error) {
    console.error(error)
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Có lỗi xảy ra khi cập nhật giỏ hàng' })
  }
}

//xóa luôn
export const deleteItemFromCartController = async (req, res) => {
  const { _id } = req.user
  const { product_id, color_id, size_id } = req.body
  try {
    const user = await Users.findById(_id)
    // Tìm và xóa sản phẩm khỏi giỏ hàng
    const updatedCart = user.cart.filter((item) => {
      return !(
        item.product.toString() === product_id &&
        (!color_id || item.color.toString() === color_id) &&
        (!size_id || item.size.toString() === size_id)
      )
    })
    user.cart = updatedCart
    await user.save()
    res.status(HTTP_STATUS.OK).json({
      message: 'Sản phẩm đã được xóa khỏi giỏ hàng',
      cart: user.cart
    })
  } catch (error) {
    console.error(error)
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Có lỗi xảy ra khi xóa sản phẩm khỏi giỏ hàng' })
  }
}
