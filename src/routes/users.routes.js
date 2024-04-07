import { Router } from 'express'
import {
  addToCartController,
  createUserController,
  deleteItemFromCartController,
  getAllUserEmailsController,
  getCurrentUserController,
  oauthGoogleController,
  sendEmailToAllUsersController,
  signInController,
  updateCartItemController,
  updateUserController
} from '~/controllers/users.controller'
import { authenticateToken, isStaff } from '~/middlewares/auth.middlewares'

const routerUsers = Router()

routerUsers.post('/register', createUserController)
routerUsers.post('/sigin', signInController)
routerUsers.get('/email', getAllUserEmailsController)
routerUsers.get('/oauth/google', oauthGoogleController)
routerUsers.put('/edit', authenticateToken, updateUserController)
routerUsers.post('/add-to-cart', authenticateToken, addToCartController)
routerUsers.post('/delete-cart', authenticateToken, deleteItemFromCartController)
routerUsers.post('/update-cart', authenticateToken, updateCartItemController)
routerUsers.get('/', authenticateToken, getCurrentUserController)
routerUsers.post('/send-email-to-all', authenticateToken, isStaff, sendEmailToAllUsersController)
export default routerUsers
