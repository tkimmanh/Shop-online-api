import HTTP_STATUS from '~/constants/httpStatus.js'
import { CATEGORY_MESSAGE } from '~/constants/message.js'
import Categories from '~/models/Categories.model.js'

export const createCategoryController = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
        message: CATEGORY_MESSAGE.CATEGORY_IS_REQUIRED
      })
    }
    const newCategory = await Categories.create(req.body)
    if (newCategory) {
      return res.status(HTTP_STATUS.OK).json({
        message: CATEGORY_MESSAGE.CATEGORY_CREATED,
        newCategory
      })
    }
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: CATEGORY_MESSAGE.CATEGORY_CREATE_FAILED
    })
  }
}
export const updateCategoryController = async (req, res) => {
  const { id } = req.params
  if (!req.body) {
    return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
      message: CATEGORY_MESSAGE.CATEGORY_IS_REQUIRED
    })
  }
  if (!id) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: CATEGORY_MESSAGE.CATEGORY_IS_NOT_FOUND
    })
  }
  try {
    const updatedCategory = await Categories.findByIdAndUpdate(id, req.body, {
      new: true
    })
    if (updatedCategory) {
      return res.status(HTTP_STATUS.OK).json({
        message: CATEGORY_MESSAGE.CATEGORY_UPDATED,
        updatedCategory
      })
    }
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: CATEGORY_MESSAGE.CATEGORY_UPDATE_FAILED
    })
  }
}

export const deleteCategoryController = async (req, res) => {
  const { id } = req.params
  if (!id) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: CATEGORY_MESSAGE.CATEGORY_IS_NOT_FOUND
    })
  }
  try {
    const deletedCategory = await Categories.findByIdAndDelete(id)
    if (deletedCategory) {
      return res.status(HTTP_STATUS.OK).json({
        message: CATEGORY_MESSAGE.CATEGORY_DELETED
      })
    }
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: CATEGORY_MESSAGE.CATEGORY_UPDATE_FAILED
    })
  }
}

export const getCategoryController = async (req, res) => {
  const { id } = req.params
  if (!id) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: CATEGORY_MESSAGE.CATEGORY_IS_NOT_FOUND
    })
  }
  try {
    const getaCategory = await Categories.findById(id)
    if (getaCategory) {
      return res.status(HTTP_STATUS.OK).json({
        message: CATEGORY_MESSAGE.CATEGORY_GET_ONE,
        getaCategory
      })
    }
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: CATEGORY_MESSAGE.CATEGORY_GET_ONE_FAILED
    })
  }
}

export const getallCategoryController = async (req, res) => {
  try {
    const getallCategory = await Categories.find({})

    if (getallCategory) {
      return res.status(HTTP_STATUS.OK).json({
        message: CATEGORY_MESSAGE.CATEGORY_GET_ALL,
        getallCategory
      })
    }
  } catch (error) {
    console.log('error:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: CATEGORY_MESSAGE.CATEGORY_GET_ALL_FAILED
    })
  }
}
