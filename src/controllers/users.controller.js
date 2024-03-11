import bcrypt from 'bcrypt'
import HTTP_STATUS from '~/constants/httpStatus'
import { PRODUCTS_MESSAGE, USER_MESSAGE } from '~/constants/message'
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
