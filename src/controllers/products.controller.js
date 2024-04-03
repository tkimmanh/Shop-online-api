import mongoose from 'mongoose'
import slugify from 'slugify'
import HTTP_STATUS from '~/constants/httpStatus'
import { PRODUCTS_MESSAGE } from '~/constants/message'
import Categories from '~/models/Categories.model'
import Colors from '~/models/Colors.models'
import Products from '~/models/Products.model'
import Sizes from '~/models/Sizes.model'
import { deleteImageOnCloudinary } from '~/utils/cloudinary'

export const createProductController = async (req, res) => {
  try {
    const { title, description, price, category } = req.body
    let { colors, sizes } = req.body

    colors = colors?.split(',')
    sizes = sizes?.split(',')

    colors = colors?.map((color) => new mongoose.Types.ObjectId(color))
    sizes = sizes?.map((size) => new mongoose.Types.ObjectId(size))

    if (!title || !description || !price || !category) {
      return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
        message: PRODUCTS_MESSAGE.PRODUCTS_IS_REQUIRED
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
      ...req.body,
      slug: slugify(title),
      thumbnail,
      images,
      colors,
      sizes
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

  try {
    colors = colors?.split(',')
    sizes = sizes?.split(',')
    colors = colors?.map((color) => new mongoose.Types.ObjectId(color))
    sizes = sizes?.map((size) => new mongoose.Types.ObjectId(size))

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
      { ...req.body, thumbnail: updatedThumbnail, images: updatedImages, colors, sizes },
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

export const productDetailsController = async (req, res) => {
  const { id } = req.params
  if (!id) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: PRODUCTS_MESSAGE.PRODUCTS_NOT_FOUND
    })
  }
  try {
    const findProduct = await Products.findById(id)
      .populate('category', '-createdAt -updatedAt -__v')
      .populate('colors', '-createdAt -updatedAt -__v')
      .populate('sizes', '-createdAt -updatedAt -__v')
    if (!findProduct) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        message: PRODUCTS_MESSAGE.PRODUCTS_NOT_FOUND
      })
    }
    return res.status(HTTP_STATUS.OK).json({
      message: PRODUCTS_MESSAGE.PRODUCT_GET_DETAILS,
      findProduct
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
    const page = parseInt(req.query.page, 10) || 1
    const limit = parseInt(req.query.limit, 10) || 10

    // phân trang page=1&limit=10
    const skip = (page - 1) * limit

    let query = Products.find()
    // Tìm kiếm theo title : products?title=name
    if (title) {
      query = query.where('title', new RegExp(req.query.title, 'i'))
    }

    // Sắp xếp //mới nhất : products?sort=newest  //cũ nhất : products?sort=oldest
    if (sort) {
      if (sort === 'newest') {
        query = query.sort('-createdAt')
      } else if (sort === 'oldest') {
        query = query.sort('createdAt')
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
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: PRODUCTS_MESSAGE.PRODUCT_GET_ERROR
    })
  }
}
export const updateProductOptions = async (req, res) => {
  const { productId } = req.params
  const { colors, sizes } = req.body

  try {
    // Tìm sản phẩm cần cập nhật
    const product = await Products.findById(productId)
    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }

    product.options = { colors, sizes }
    await product.save()

    res.status(200).json({ message: 'Product updated with new options', product })
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error })
  }
}
