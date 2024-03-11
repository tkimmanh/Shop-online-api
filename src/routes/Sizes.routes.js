import { Router } from 'express'
import {
  createSizeController,
  deleteSizeController,
  getSizeController,
  getallSizeController,
  updateSizeController
} from '~/controllers/sizes.controller'
import { authenticateToken, isAdmin } from '~/middlewares/auth.middlewares'

const routerSizes = Router()

routerSizes.get('/', getallSizeController)
routerSizes.get('/:id', getSizeController)
routerSizes.post('/', authenticateToken, isAdmin, createSizeController)
routerSizes.put('/:id', authenticateToken, isAdmin, updateSizeController)
routerSizes.delete('/:id', authenticateToken, isAdmin, deleteSizeController)

export default routerSizes
