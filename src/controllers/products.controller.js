import mongoose from 'mongoose'
import slugify from 'slugify'
import HTTP_STATUS from '~/constants/httpStatus'
import { PRODUCTS_MESSAGE } from '~/constants/message'
import Categories from '~/models/Categories.model'
import Colors from '~/models/Colors.models'
import Products from '~/models/Products.model'
import Review from '~/models/Reviews.model'
import Sizes from '~/models/Sizes.model'
import Users from '~/models/Users.model'
import { deleteImageOnCloudinary } from '~/utils/cloudinary'

export const createProductController = async (req, res) => {
  try {
    const { title, description, price, category, quantity } = req.body
    let { colors, sizes } = req.body

    let colorIds = []
    if (colors && typeof colors === 'string') {
      colorIds = colors
        .split(',')
        .map((color) => color.trim())
        .filter((color) => color)
        .map((color) => new mongoose.Types.ObjectId(color))
    }

    let sizeIds = []
    if (sizes && typeof sizes === 'string') {
      sizeIds = sizes
        .split(',')
        .map((size) => size.trim())
        .filter((size) => size)
        .map((size) => new mongoose.Types.ObjectId(size))
    }

    if (!title || !description || !price || !category || !quantity) {
      return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
        message: PRODUCTS_MESSAGE.PRODUCTS_IS_REQUIRED
      })
    }
    const productExist = await Products.findOne({ title })
    if (productExist) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Sản phẩm đã tồn tại'
      })
    }
    const thumbnail = req?.files?.thumbnail && {
      url: req?.files?.thumbnail[0].path,
      public_id: req.files.thumbnail[0].filename
    }

    const images =
      req?.files?.images &&
      req?.files?.images?.map((file) => ({
        url: file.path,
        public_id: file.filename
      }))
    const newProduct = await Products.create({
      title,
      description,
      price,
      category,
      quantity,
      slug: slugify(title),
      thumbnail,
      images,
      colors: colorIds,
      sizes: sizeIds
    })

    return res.status(HTTP_STATUS.OK).json({
      message: PRODUCTS_MESSAGE.PRODUCTS_CREATED,
      newProduct
    })
  } catch (error) {
    console.error(error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: PRODUCTS_MESSAGE.PRODUCTS_CREATED_FAILED
    })
  }
}

export const updateProductController = async (req, res) => {
  const { id } = req.params
  let { colors, sizes } = req.body

  if (!id) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: PRODUCTS_MESSAGE.PRODUCTS_NOT_FOUND
    })
  }
  const colorIds = colors
    .split(',')
    .map((color) => color.trim())
    .filter((color) => color)
    .map((color) => new mongoose.Types.ObjectId(color))
  const sizeIds = sizes
    .split(',')
    .map((size) => size.trim())
    .filter((size) => size)
    .map((size) => new mongoose.Types.ObjectId(size))

  try {
    const productToUpdate = await Products.findById(id)
    if (!productToUpdate) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: PRODUCTS_MESSAGE.PRODUCTS_NOT_FOUND
      })
    }
    if (req.files?.thumbnail && productToUpdate.thumbnail?.public_id) {
      await deleteImageOnCloudinary(productToUpdate?.thumbnail.public_id)
    }
    if (req.files?.images && productToUpdate.images?.length > 0) {
      const deletePromises = productToUpdate.images.map((image) => {
        if (image.public_id) {
          return deleteImageOnCloudinary(image?.public_id)
        }
        return Promise.resolve()
      })
      await Promise.all(deletePromises)
    }

    if (req.body.title) {
      req.body.slug = slugify(req.body.title)
    }

    const updatedThumbnail = req.files?.thumbnail
      ? {
          url: req.files.thumbnail[0].path,
          public_id: req.files.thumbnail[0].filename
        }
      : productToUpdate.thumbnail

    const updatedImages = req.files?.images
      ? req.files.images.map((file) => ({
          url: file.path,
          public_id: file.filename
        }))
      : productToUpdate.images

    const updateProduct = await Products.findOneAndUpdate(
      { _id: id },
      { ...req.body, thumbnail: updatedThumbnail, images: updatedImages, colors: colorIds, sizes: sizeIds },
      { new: true }
    )
    if (updateProduct) {
      return res.status(HTTP_STATUS.OK).json({
        message: PRODUCTS_MESSAGE.PRODUCT_UPDATED,
        updateProduct
      })
    }
  } catch (error) {
    console.log('error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: PRODUCTS_MESSAGE.PRODUCTS_UPDATE_ERROR
    })
  }
}

export const deleteProductController = async (req, res) => {
  const { id } = req.params
  if (!id) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: PRODUCTS_MESSAGE.PRODUCTS_NOT_FOUND
    })
  }
  try {
    const product = await Products.findById(id)

    if (!product) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: PRODUCTS_MESSAGE.PRODUCTS_NOT_FOUND
      })
    }

    if (product.thumbnail && product.thumbnail.public_id) {
      await deleteImageOnCloudinary(product.thumbnail.public_id)
    }

    if (product.images && product.images.length > 0) {
      for (const image of product.images) {
        await deleteImageOnCloudinary(image.public_id)
      }
    }

    const users = await Users.find({ 'cart.product': id })
    await Promise.all(
      users.map(async (user) => {
        user.cart = user.cart.filter((item) => item.product.toString() !== id)
        await user.save()
      })
    )
    const usersWishlist = await Users.find({ wishlist: id })
    await Promise.all(
      usersWishlist.map(async (user) => {
        user.wishlist = user.wishlist.filter((item) => item.toString() !== id)
        await user.save()
      })
    )

    await Products.findByIdAndDelete(id)

    res.status(HTTP_STATUS.OK).json({
      message: PRODUCTS_MESSAGE.PRODUCT_DELETED
    })
  } catch (error) {
    console.log('error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: PRODUCTS_MESSAGE.PRODUCT_DELETED_FAILED
    })
  }
}

export const setStatusProductController = async (req, res) => {
  const { id } = req.params
  const { status } = req.body
  if (!id) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: PRODUCTS_MESSAGE.PRODUCTS_NOT_FOUND
    })
  }
  try {
    const product = await Products.findById({ _id: id })
    if (!product) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: PRODUCTS_MESSAGE.PRODUCTS_NOT_FOUND
      })
    }

    await Products.findByIdAndUpdate({ _id: id }, { status: status })
    res.status(HTTP_STATUS.OK).json({
      message: PRODUCTS_MESSAGE.PRODUCT_DELETED
    })
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: PRODUCTS_MESSAGE.PRODUCT_DELETED_FAILED
    })
  }
}

export const productDetailsController = async (req, res) => {
  const { id } = req.params
  if (!id) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: PRODUCTS_MESSAGE.PRODUCTS_NOT_FOUND
    })
  }
  try {
    const product = await Products.findById(id)
      .populate('category', '-createdAt -updatedAt -__v')
      .populate('colors', '-createdAt -updatedAt -__v')
      .populate('sizes', '-createdAt -updatedAt -__v')
      .populate('reviews', '-createdAt -updatedAt -__v')
    if (!product) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        message: PRODUCTS_MESSAGE.PRODUCTS_NOT_FOUND
      })
    }
    let averageRating = 0
    if (product.reviews.length > 0) {
      averageRating = product.reviews.reduce((acc, review) => acc + review.star, 0) / product.reviews.length
    }
    const response = {
      ...product.toObject(),
      averageRating,
      totalReviews: product.reviews.length
    }
    return res.status(HTTP_STATUS.OK).json({
      message: PRODUCTS_MESSAGE.PRODUCT_GET_DETAILS,
      response
    })
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: PRODUCTS_MESSAGE.PRODUCT_GET_ERROR
    })
  }
}

export const getAllProductController = async (req, res) => {
  try {
    const { title, sort, priceFrom, priceTo, price, color, sizes, category } = req.query
    let { status } = req.query
    const page = parseInt(req.query.page, 10) || 1
    const limit = parseInt(req.query.limit, 10) || 10

    status = status === 'false' ? false : true

    // phân trang page=1&limit=10
    const skip = (page - 1) * limit

    let query = Products.find({ status: status })
    // Tìm kiếm theo title : products?title=name
    if (title) {
      query = query.where('title', new RegExp(req.query.title, 'i'))
    }

    // Sắp xếp //mới nhất : products?sort=newest  //cũ nhất : products?sort=oldest
    if (sort) {
      if (sort === 'min') {
        query = query.sort('price') // Sắp xếp từ thấp đến cao
      } else if (sort === 'max') {
        query = query.sort('-price') // Sắp xếp từ cao xuống thấp
      } else if (sort === 'newest') {
        query = query.sort('-createdAt') // Sản phẩm mới nhất
      } else if (sort === 'oldest') {
        query = query.sort('createdAt') // Sản phẩm cũ nhất
      } else if (sort === 'sold') {
        query = query.sort('-sold') // Sản phẩm bán chạy nhất
      }
    }

    // Lọc theo khoảng giá :  products?priceFrom=100000&priceTo=500000
    if (priceFrom || priceTo) {
      query = query
        .where('price')
        .gte(priceFrom || 0)
        .lte(priceTo || Number.MAX_SAFE_INTEGER)
    }

    // Lọc theo giá cao nhất hoặc thấp nhất : /products?price=min , /products?price=max
    if (price) {
      if (price === 'min') {
        query = query.sort('price')
      } else if (price === 'max') {
        query = query.sort('-price')
      }
    }

    // Lọc theo màu sắc : products?color=red,blue
    if (color) {
      const colorNames = color.split(',').map((c) => new RegExp(c.trim(), 'i'))
      const colors = await Colors.find({ name: { $in: colorNames } })
      const colorIds = colors.map((c) => c._id)
      query = query.where('colors').in(colorIds)
    }

    // Lọc theo kích cỡ : ?sizes=M,L
    if (sizes) {
      const sizeNames = sizes.split(',').map((s) => new RegExp(s.trim(), 'i'))
      const sizesDocs = await Sizes.find({ name: { $in: sizeNames } })
      const sizeIds = sizesDocs.map((s) => s._id)
      query = query.where('sizes').in(sizeIds)
    }

    // Lọc theo danh mục ?category=categoryname
    if (category) {
      const categoryDoc = await Categories.findOne({ title: new RegExp(req.query.category, 'i') })
      if (categoryDoc) {
        query = query.where('category').equals(categoryDoc._id)
      }
    }
    // query kết hợp : products?priceFrom=100000&priceTo=500000&color=red,green&price=min

    query = query.skip(skip).limit(limit)

    const products = await query
      .populate('category', 'title')
      .populate('colors', 'name')
      .populate('sizes', 'name')
      .exec()

    const counts = await Products.countDocuments(query.getFilter())

    res.status(HTTP_STATUS.OK).json({
      message: PRODUCTS_MESSAGE.PRODUCTS_GET_ALL,
      products,
      counts
    })
  } catch (error) {
    console.log('error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: PRODUCTS_MESSAGE.PRODUCT_GET_ERROR
    })
  }
}

export const addOrUpdateProductReviewController = async (req, res) => {
  const { productId } = req.params
  const { star } = req.body
  const { _id } = req.user

  try {
    let review = await Review.findOne({ product: productId, user: _id })

    if (review) {
      review.star = star
      await review.save()
    } else {
      review = await Review.create({ product: productId, user: _id, star })
      await Products.findByIdAndUpdate(productId, { $push: { reviews: review._id } })
    }
    res.status(HTTP_STATUS.OK).json({ message: 'Đánh giá đã được cập nhật.' })
  } catch (error) {
    console.error(error)
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Có lỗi xảy ra khi cập nhật đánh giá.' })
  }
}
