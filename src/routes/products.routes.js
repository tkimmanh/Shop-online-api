import { Router } from 'express'
import {
  createProductController,
  deleteProductController,
  getAllProductController,
  productDetailsController,
  updateProductController
} from '~/controllers/products.controller'

const routerProducts = Router()

routerProducts.get('/', getAllProductController)
routerProducts.get('/:id', productDetailsController)
routerProducts.post('/', createProductController)
routerProducts.put('/:id', updateProductController)
routerProducts.delete('/:id', deleteProductController)

export default routerProducts
