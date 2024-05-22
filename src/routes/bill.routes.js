import { Router } from 'express'
import { getAllBillsController, getUserBillsUserController } from '~/controllers/bill.controller'
import { authenticateToken } from '~/middlewares/auth.middlewares'

const routerBill = Router()

routerBill.get('/admin/:orderId', authenticateToken, getAllBillsController)
routerBill.get('/user', authenticateToken, getUserBillsUserController)

export default routerBill
