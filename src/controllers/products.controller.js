import slugify from 'slugify'
import HTTP_STATUS from '~/constants/httpStatus'
import { PRODUCTS_MESSAGE } from '~/constants/message'
import Products from '~/models/Products.model'

export const createProductController = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Request body is missing'
      })
    }

    const { title, description, price, quantity } = req.body
    if (!title || !description || !price || !quantity) {
      return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
        message: PRODUCTS_MESSAGE.PRODUCTS_IS_REQUIRED
      })
    }
    if (req.body.title) {
      req.body.slug = slugify(title)
    }
    const newProduct = await Products.create(req.body)
    if (newProduct) {
      res.status(HTTP_STATUS.OK).json({
        message: PRODUCTS_MESSAGE.PRODUCTS_CREATED,
        newProduct
      })
    }
  } catch (error) {
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
    if (req.body.title) {
      req.body.slug = slugify(req.body.title)
    }
    const updateProduct = await Products.findOneAndUpdate({ _id: id }, req.body, { new: true })

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
    const deleteProduct = await Products.findOneAndDelete(id)
    res.status(HTTP_STATUS.OK).json({
      message: PRODUCTS_MESSAGE.PRODUCT_DELETED,
      deleteProduct
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
    const findProduct = await Products.findById(id)
    res.status(HTTP_STATUS.OK).json({
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
  //gte trở lên , lte trở xuống
  try {
    const queryObj = { ...req.query }
    const excludeFields = ['page', 'sort', 'limit', 'fields']
    excludeFields.forEach((el) => delete queryObj[el])
    let queryStr = JSON.stringify(queryObj)
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`)

    let query = Products.find(JSON.parse(queryStr))

    // Sorting

    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ')
      query = query.sort(sortBy)
    } else {
      query = query.sort('-createdAt')
    }

    // limiting the fields

    if (req.query.fields) {
      const fields = req.query.fields.split(',').join(' ')
      query = query.select(fields)
    } else {
      query = query.select('-__v')
    }

    // pagination

    const page = req.query.page
    const limit = req.query.limit
    const skip = (page - 1) * limit
    query = query.skip(skip).limit(limit)
    if (req.query.page) {
      const productCount = await Products.countDocuments()
      if (skip >= productCount) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          message: PRODUCTS_MESSAGE.PRODUCT_PAGE_NOT_FOUND
        })
      }
    }
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
