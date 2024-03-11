import { Router } from 'express'
import {
  createSizeController,
  deleteSizeController,
  getSizeController,
  getallSizeController,
  updateSizeController
} from '~/controllers/sizes.controller'

const routerSizes = Router()

routerSizes.get('/', getallSizeController)
routerSizes.post('/', createSizeController)
routerSizes.get('/:id', getSizeController)
routerSizes.put('/:id', updateSizeController)
routerSizes.delete('/:id', deleteSizeController)

export default routerSizes
