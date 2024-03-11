import { Router } from 'express'

import {
  createProductController,
  deleteProductController,
  getAllProductController,
  productDetailsController,
  updateProductController,
  updateProductOptions
} from '~/controllers/products.controller'
import { customUploadMiddleware } from '~/middlewares/uploadImage.middlewares'

const routerProducts = Router()

routerProducts.get('/', getAllProductController)
routerProducts.get('/:id', productDetailsController)
routerProducts.post('/', customUploadMiddleware, createProductController)
routerProducts.put('/:id', customUploadMiddleware, updateProductController)
routerProducts.delete('/:id', deleteProductController)
routerProducts.put('/:productId/options', updateProductOptions)

export default routerProducts
