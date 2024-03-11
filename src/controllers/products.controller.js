import mongoose from 'mongoose'
import slugify from 'slugify'
import HTTP_STATUS from '~/constants/httpStatus'
import { PRODUCTS_MESSAGE } from '~/constants/message'
import Products from '~/models/Products.model'
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

    const thumbnail = req.files.thumbnail
      ? {
          url: req.files.thumbnail[0].path,
          public_id: req.files.thumbnail[0].filename
        }
      : null

    const images = req.files.images
      ? req.files.images.map((file) => ({
          url: file.path,
          public_id: file.filename
        }))
      : []

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
  if (!id) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: PRODUCTS_MESSAGE.PRODUCTS_NOT_FOUND
    })
  }

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
      { ...req.body, thumbnail: updatedThumbnail, images: updatedImages },
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
    const queryObj = { ...req.query }
    const excludeFields = ['page', 'sort', 'limit', 'fields']
    excludeFields.forEach((el) => delete queryObj[el])
    let queryStr = JSON.stringify(queryObj)
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`)

    let query = Products.find(JSON.parse(queryStr))
      .populate('category', '-createdAt -updatedAt -__v')
      .populate('colors', '-createdAt -updatedAt -__v')
      .populate('sizes', '-createdAt -updatedAt -__v')

    // Sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ')
      query = query.sort(sortBy)
    } else {
      query = query.sort('-createdAt')
    }

    // Limiting the fields
    if (req.query.fields) {
      const fields = req.query.fields.split(',').join(' ')
      query = query.select(fields)
    } else {
      query = query.select('-__v')
    }

    // Pagination
    const page = req.query.page
    const limit = req.query.limit
    const skip = (page - 1) * limit
    query = query.skip(skip).limit(limit)

    const product = await query

    res.status(HTTP_STATUS.OK).json({
      message: PRODUCTS_MESSAGE.PRODUCTS_GET_ALL,
      product
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
