import { Router } from 'express'
import {
  addToCartController,
  createUserController,
  deleteItemFromCartController,
  deleteUserByAdminController,
  detailUserController,
  editUserByAdminController,
  getAllUserByAdminController,
  getAllUserEmailsController,
  getCurrentUserController,
  oauthGoogleController,
  sendEmailToAllUsersController,
  signInController,
  updateCartItemController,
  updateUserController
} from '~/controllers/users.controller'
import { authenticateToken, isAdmin, isStaff } from '~/middlewares/auth.middlewares'

const routerUsers = Router()

routerUsers.post('/register', createUserController)
routerUsers.post('/sigin', signInController)
routerUsers.get('/oauth/google', oauthGoogleController)
routerUsers.put('/edit', authenticateToken, updateUserController)
routerUsers.post('/add-to-cart', authenticateToken, addToCartController)
routerUsers.post('/delete-cart', authenticateToken, deleteItemFromCartController)
routerUsers.post('/update-cart', authenticateToken, updateCartItemController)
routerUsers.get('/', authenticateToken, getCurrentUserController)
routerUsers.get('/email', authenticateToken, isStaff, getAllUserEmailsController)
routerUsers.get('/all-users', authenticateToken, isAdmin, getAllUserByAdminController)
routerUsers.post('/send-email-to-all', authenticateToken, isStaff, sendEmailToAllUsersController)
routerUsers.put('/edit-by-admin/:id', authenticateToken, isAdmin, editUserByAdminController)
routerUsers.delete('/delete-by-admin/:id', authenticateToken, isAdmin, deleteUserByAdminController)
routerUsers.get('/get-by-admin/:id', authenticateToken, isAdmin, detailUserController)
export default routerUsers
