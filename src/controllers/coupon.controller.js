import HTTP_STATUS from '~/constants/httpStatus'
import { PRODUCTS_MESSAGE } from '~/constants/message'
import Coupons from '~/models/Coupons.model'
import { makeid } from '~/utils/commons'

export const createCouponController = async (req, res) => {
  const { discount, expiration_date } = req.body
  let { code } = req.body
  if (!discount || !expiration_date) {
    return res.status(400).json({
      message: PRODUCTS_MESSAGE.PRODUCTS_IS_REQUIRED
    })
  }
  if (!code) {
    code = makeid(5).toUpperCase()
  }
  const result = await Coupons.create({
    code,
    discount,
    expiration_date
  })
  return res.status(HTTP_STATUS.OK).json({
    message: 'Tạo mã giảm giá thành công',
    result
  })
}

export const listCounponController = async (req, res) => {
  try {
    const result = await Coupons.find()
    return res.status(HTTP_STATUS.OK).json({
      message: 'Danh sách mã giảm giá',
      result
    })
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: error.message
    })
  }
}

export const updateCouponController = async (req, res) => {
  const { id } = req.params
  const { discount, expiration_date, is_active, code } = req.body
  try {
    await Coupons.findByIdAndUpdate(id, {
      discount,
      code,
      expiration_date,
      is_active
    })
    return res.status(HTTP_STATUS.OK).json({
      message: 'Cập nhật mã giảm giá thành công'
    })
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: error.message
    })
  }
}

export const deleteCouponController = async (req, res) => {
  const { id } = req.params
  try {
    await Coupons.findByIdAndDelete(id)
    return res.status(HTTP_STATUS.OK).json({
      message: 'Xóa mã giảm giá thành công'
    })
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: error.message
    })
  }
}

export const getCouponController = async (req, res) => {
  try {
    const { id } = req.params
    const result = await Coupons.findById(id)
    return res.status(HTTP_STATUS.OK).json({
      message: 'Chi tiết mã giảm giá',
      result
    })
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: error.message
    })
  }
}
