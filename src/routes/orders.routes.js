import { Router } from 'express'
import {
  calculateAnnualRevenueController,
  cancelOrderController,
  deleteOrderController,
  getAllOrdersForAdminController,
  listUserOrdersController,
  placeOrderController,
  updateOrderStatusByAdminController
} from '~/controllers/orders.controller'

import { authenticateToken, isStaff } from '~/middlewares/auth.middlewares'

const routerOrder = Router()

routerOrder.post('/', authenticateToken, placeOrderController)
routerOrder.get('/my-order', authenticateToken, listUserOrdersController)
routerOrder.patch('/:id/cancel', authenticateToken, cancelOrderController)
routerOrder.delete('/:id/delete', authenticateToken, deleteOrderController)
routerOrder.get('/list-orders', authenticateToken, isStaff, getAllOrdersForAdminController)
routerOrder.patch('/:id/update-status-order', authenticateToken, isStaff, updateOrderStatusByAdminController)
routerOrder.get('/revenue/monthly', authenticateToken, isStaff, calculateAnnualRevenueController)
export default routerOrder
