import HTTP_STATUS from '~/constants/httpStatus.js'
import { VARRIANTS_MESSAGE } from '~/constants/message.js'
import Colors from '~/models/Colors.models'

export const createColorController = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
        message: VARRIANTS_MESSAGE.VARRIANTS_NAME_IS_REQUIRED
      })
    }
    const newColor = await Colors.create(req.body)
    if (newColor) {
      return res.status(HTTP_STATUS.OK).json({
        message: VARRIANTS_MESSAGE.VARRIANTS_CREATED,
        newColor
      })
    }
    return false
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: VARRIANTS_MESSAGE.VARRIANTS_CREATED_FAILED
    })
  }
}
export const updateColorController = async (req, res) => {
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
    const updatedColor = await Colors.findByIdAndUpdate({ _id: id }, req.body, {
      new: true
    })
    if (updatedColor) {
      return res.status(HTTP_STATUS.OK).json({
        message: VARRIANTS_MESSAGE.VARRIANTS_UPDATED,
        updatedColor
      })
    }
    return false
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: VARRIANTS_MESSAGE.VARRIANTS_UPDATED_FAILED
    })
  }
}

export const deleteColorController = async (req, res) => {
  const { id } = req.params
  if (!id) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: VARRIANTS_MESSAGE.VARRIANTS_NOT_FOUND
    })
  }
  try {
    const deletedColor = await Colors.findByIdAndDelete(id)
    if (deletedColor) {
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

export const getColorController = async (req, res) => {
  const { id } = req.params
  if (!id) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: VARRIANTS_MESSAGE.VARRIANTS_NOT_FOUND
    })
  }
  try {
    const getColor = await Colors.findById(id)
    if (getColor) {
      return res.status(HTTP_STATUS.OK).json({
        message: VARRIANTS_MESSAGE.VARRIANTS_GET_ONE,
        getColor
      })
    }
    return false
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: VARRIANTS_MESSAGE.VARRIANTS_GET_ONE_FAILED
    })
  }
}

export const getallColorsController = async (req, res) => {
  try {
    const getallColors = await Colors.find({})
    if (getallColors) {
      return res.status(HTTP_STATUS.OK).json({
        message: VARRIANTS_MESSAGE.VARRIANTS_GET_ALL,
        getallColors
      })
    }
    return false
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: VARRIANTS_MESSAGE.VARRIANTS_GET_ALL_FAILED
    })
  }
}
