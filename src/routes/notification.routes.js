import { Router } from 'express'

import {
  getUserNotificationsController,
  markNotificationAsReadController
} from '~/controllers/notifications.controller'
import { authenticateToken } from '~/middlewares/auth.middlewares'

const notificationRouter = Router()

notificationRouter.get('/', authenticateToken, getUserNotificationsController)
notificationRouter.patch('/:notificationId', authenticateToken, markNotificationAsReadController)

export default notificationRouter
