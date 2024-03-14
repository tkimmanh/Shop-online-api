import { Router } from 'express'
import {
  cancelOrderController,
  deleteOrderController,
  listUserOrdersController,
  placeOrderController
} from '~/controllers/orders.controller'

import { authenticateToken } from '~/middlewares/auth.middlewares'

const routerOrder = Router()

routerOrder.post('/', authenticateToken, placeOrderController)
routerOrder.get('/my-order', authenticateToken, listUserOrdersController)
routerOrder.patch('/:id/cancel', authenticateToken, cancelOrderController)
routerOrder.delete('/:id/delete', authenticateToken, deleteOrderController)
export default routerOrder
