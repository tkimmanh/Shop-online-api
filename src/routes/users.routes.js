import { Router } from 'express'
import {
  addToCartController,
  createUserController,
  deleteItemFromCartController,
  getCurrentUserController,
  signInController,
  updateCartItemController,
  updateUserController
} from '~/controllers/users.controller'
import { authenticateToken } from '~/middlewares/auth.middlewares'

const routerUsers = Router()

routerUsers.post('/register', createUserController)
routerUsers.post('/sigin', signInController)
routerUsers.put('/edit', authenticateToken, updateUserController)
routerUsers.post('/add-to-cart', authenticateToken, addToCartController)
routerUsers.post('/delete-cart', authenticateToken, deleteItemFromCartController)
routerUsers.post('/update-cart', authenticateToken, updateCartItemController)
routerUsers.get('/', authenticateToken, getCurrentUserController)
export default routerUsers
