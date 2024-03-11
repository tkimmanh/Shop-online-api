import { Router } from 'express'
import {
  createColorController,
  deleteColorController,
  getColorController,
  getallColorsController,
  updateColorController
} from '~/controllers/colors.controller'

const routerColors = Router()

routerColors.get('/', getallColorsController)
routerColors.post('/', createColorController)
routerColors.get('/:id', getColorController)
routerColors.put('/:id', updateColorController)
routerColors.delete('/:id', deleteColorController)

export default routerColors
