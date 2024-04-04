const { Router } = require('express')
const {
  createCouponController,
  listCounponController,
  updateCouponController,
  deleteCouponController,
  getCouponController
} = require('~/controllers/coupon.controller')
const { isAdmin, authenticateToken } = require('~/middlewares/auth.middlewares')

const couponRouter = Router()

couponRouter.post('/create', authenticateToken, isAdmin, createCouponController)
couponRouter.get('/', authenticateToken, isAdmin, listCounponController)
couponRouter.get('/:id', authenticateToken, isAdmin, getCouponController)
couponRouter.put('/:id', authenticateToken, isAdmin, updateCouponController)
couponRouter.delete('/:id', authenticateToken, isAdmin, deleteCouponController)

export default couponRouter
