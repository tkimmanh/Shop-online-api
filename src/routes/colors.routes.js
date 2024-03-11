import { Router } from 'express'
import {
  createColorController,
  deleteColorController,
  getColorController,
  getallColorsController,
  updateColorController
} from '~/controllers/colors.controller'
import { authenticateToken, isAdmin } from '~/middlewares/auth.middlewares'

const routerColors = Router()

routerColors.get('/', getallColorsController)
routerColors.get('/:id', getColorController)
routerColors.post('/', authenticateToken, isAdmin, createColorController)
routerColors.put('/:id', authenticateToken, isAdmin, updateColorController)
routerColors.delete('/:id', authenticateToken, isAdmin, deleteColorController)

export default routerColors
