import { VARRIANTS_MESSAGE } from '~/constants/message.js'
import HTTP_STATUS from '~/constants/httpStatus.js'
import Sizes from '~/models/Sizes.model'

export const createSizeController = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
        message: VARRIANTS_MESSAGE.VARRIANTS_NAME_IS_REQUIRED
      })
    }
    const newSize = await Sizes.create(req.body)
    if (newSize) {
      return res.status(HTTP_STATUS.OK).json({
        message: VARRIANTS_MESSAGE.VARRIANTS_CREATED,
        newSize
      })
    }
    return false
  } catch (error) {
    console.log("error:", error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: VARRIANTS_MESSAGE.VARRIANTS_CREATED_FAILED
    })
  }
}
export const updateSizeController = async (req, res) => {
  const { id } = req.params
  if (!req.body) {
    return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
      message: VARRIANTS_MESSAGE.VARRIANTS_NAME_IS_REQUIRED
    })
  }
  if (!id) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: VARRIANTS_MESSAGE.VARRIANTS_NOT_FOUND
    })
  }
  try {
    const updatedSize = await Sizes.findByIdAndUpdate(id, req.body, {
      new: true
    })
    if (updatedSize) {
      return res.status(HTTP_STATUS.OK).json({
        message: VARRIANTS_MESSAGE.VARRIANTS_UPDATED,
        updatedSize
      })
    }
    return false
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: VARRIANTS_MESSAGE.VARRIANTS_UPDATED_FAILED
    })
  }
}

export const deleteSizeController = async (req, res) => {
  const { id } = req.params
  if (!id) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: VARRIANTS_MESSAGE.VARRIANTS_NOT_FOUND
    })
  }
  try {
    const deletedSize = await Sizes.findByIdAndDelete(id)
    if (deletedSize) {
      return res.status(HTTP_STATUS.OK).json({
        message: VARRIANTS_MESSAGE.VARRIANTS_DELETED
      })
    }
    return false
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: VARRIANTS_MESSAGE.VARRIANTS_DELETED_FAILED
    })
  }
}

export const getSizeController = async (req, res) => {
  const { id } = req.params
  if (!id) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: VARRIANTS_MESSAGE.VARRIANTS_NOT_FOUND
    })
  }
  try {
    const getSize = await Sizes.findById(id)
    if (getSize) {
      return res.status(HTTP_STATUS.OK).json({
        message: VARRIANTS_MESSAGE.VARRIANTS_GET_ONE,
        getSize
      })
    }
    return false
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: VARRIANTS_MESSAGE.VARRIANTS_GET_ONE_FAILED
    })
  }
}

export const getallSizeController = async (req, res) => {
  try {
    const getallSizes = await Sizes.find({})
    if (getallSizes) {
      return res.status(HTTP_STATUS.OK).json({
        message: VARRIANTS_MESSAGE.VARRIANTS_GET_ALL,
        getallSizes
      })
    }
    return false
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: VARRIANTS_MESSAGE.VARRIANTS_GET_ALL_FAILED
    })
  }
}
