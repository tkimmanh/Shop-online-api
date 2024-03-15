import { Router } from 'express'
import {
  cancelOrderController,
  deleteOrderController,
  getAllOrdersForAdminController,
  listUserOrdersController,
  placeOrderController
} from '~/controllers/orders.controller'

import { authenticateToken, isAdmin } from '~/middlewares/auth.middlewares'

const routerOrder = Router()

routerOrder.post('/', authenticateToken, placeOrderController)
routerOrder.get('/my-order', authenticateToken, listUserOrdersController)
routerOrder.patch('/:id/cancel', authenticateToken, cancelOrderController)
routerOrder.delete('/:id/delete', authenticateToken, deleteOrderController)
routerOrder.get('/list-orders', authenticateToken, isAdmin, getAllOrdersForAdminController)
routerOrder.get('/:id/update-status-order', authenticateToken, isAdmin, getAllOrdersForAdminController)
export default routerOrder
