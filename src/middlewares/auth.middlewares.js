import HTTP_STATUS from '~/constants/httpStatus'
import { USER_MESSAGE } from '~/constants/message'
import Users from '~/models/Users.model'
import { verifyToken } from '~/utils/jwt'

export const authenticateToken = async (req, res, next) => {
  if (req?.headers?.authorization?.startsWith('Bearer')) {
    const token = req.headers.authorization.split(' ')[1]
    try {
      const decoded = await verifyToken({ token })
      const { _id } = decoded
      const user = await Users.findOne({ _id })
      if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          message: USER_MESSAGE.USER_NOT_FOUND
        })
      }
      req.user = user
      next()
    } catch (error) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: 'Token không hợp lệ'
      })
    }
  }
}
export const isAdmin = async (req, res, next) => {
  const { role } = req.user
  if (role !== 'admin')
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      message: 'Không thể truy cập'
    })
  next()
}
export const isStaff = async (req, res, next) => {
  const { role } = req.user
  if (role !== 'staff')
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      message: 'Không thể truy cập'
    })
  next()
}
