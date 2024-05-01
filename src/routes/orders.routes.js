import { Router } from 'express'
import {
  applyCouponController,
  calculateAnnualRevenueController,
  deleteOrderController,
  getAllOrdersForAdminController,
  getOrderCountsByStatusController,
  getOrderDetailController,
  getTopSellingCategoriesController,
  getTopSellingProductsController,
  listReturnOrdersController,
  listUserOrdersController,
  paymentSuccessController,
  placeOrderController,
  updateOrderStatusByAdminController,
  updateOrderUserController
} from '~/controllers/orders.controller'

import { authenticateToken, isStaff } from '~/middlewares/auth.middlewares'

const routerOrder = Router()

routerOrder.post('/', authenticateToken, placeOrderController)
routerOrder.post('/apply-coupon', authenticateToken, applyCouponController)
routerOrder.get('/my-order', authenticateToken, listUserOrdersController)
routerOrder.patch('/:id/update', authenticateToken, updateOrderUserController)
routerOrder.delete('/:id/delete', authenticateToken, deleteOrderController)
routerOrder.get('/get-counts-status', authenticateToken, getOrderCountsByStatusController)
routerOrder.get('/:id/detail', authenticateToken, getOrderDetailController)
routerOrder.get('/returns', authenticateToken, isStaff, listReturnOrdersController)
routerOrder.get('/payment-success', authenticateToken, paymentSuccessController)
routerOrder.get('/revenue/monthly', authenticateToken, isStaff, calculateAnnualRevenueController)
routerOrder.get('/category-top-selling', authenticateToken, isStaff, getTopSellingCategoriesController)
routerOrder.get('/top-selling/:period', authenticateToken, isStaff, getTopSellingProductsController)
routerOrder.get('/list-orders', authenticateToken, isStaff, getAllOrdersForAdminController)
routerOrder.patch('/:id/update-status-order', authenticateToken, isStaff, updateOrderStatusByAdminController)

export default routerOrder
