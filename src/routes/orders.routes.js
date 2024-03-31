import { Router } from 'express'
import {
  calculateAnnualRevenueController,
  deleteOrderController,
  getAllOrdersForAdminController,
  getOrderDetailController,
  listUserOrdersController,
  paymentSuccessController,
  placeOrderController,
  updateOrderStatusByAdminController,
  updateOrderUserController
} from '~/controllers/orders.controller'

import { authenticateToken, isStaff } from '~/middlewares/auth.middlewares'

const routerOrder = Router()

routerOrder.post('/', authenticateToken, placeOrderController)
routerOrder.get('/my-order', authenticateToken, listUserOrdersController)
routerOrder.patch('/:id/update', authenticateToken, updateOrderUserController)
routerOrder.delete('/:id/delete', authenticateToken, deleteOrderController)
routerOrder.get('/:id/detail', authenticateToken, getOrderDetailController)
routerOrder.get('/payment-success', authenticateToken, paymentSuccessController)
routerOrder.get('/revenue/monthly', authenticateToken, isStaff, calculateAnnualRevenueController)
routerOrder.get('/list-orders', authenticateToken, isStaff, getAllOrdersForAdminController)
routerOrder.patch('/:id/update-status-order', authenticateToken, isStaff, updateOrderStatusByAdminController)

export default routerOrder
