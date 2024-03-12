import { Router } from 'express'
import {
  addToCartController,
  createUserController,
  deleteItemFromCartController,
  getCartController,
  signInController,
  updateCartItemController
} from '~/controllers/users.controller'
import { authenticateToken } from '~/middlewares/auth.middlewares'

const routerUsers = Router()

routerUsers.post('/register', createUserController)
routerUsers.post('/sigin', signInController)
routerUsers.post('/add-to-cart', authenticateToken, addToCartController)
routerUsers.post('/delete-cart', authenticateToken, deleteItemFromCartController)
routerUsers.post('/update-cart', authenticateToken, updateCartItemController)
routerUsers.get('/cart', authenticateToken, getCartController)
export default routerUsers
