import { Router } from 'express'

import {
  addOrUpdateProductReviewController,
  createProductController,
  deleteProductController,
  getAllProductController,
  productDetailsController,
  updateProductController
} from '~/controllers/products.controller'
import { authenticateToken, isAdmin } from '~/middlewares/auth.middlewares'
import { customUploadMiddleware } from '~/middlewares/uploadImage.middlewares'

const routerProducts = Router()

routerProducts.get('/', getAllProductController)
routerProducts.get('/:id', productDetailsController)
routerProducts.post('/:productId/reviews', authenticateToken, addOrUpdateProductReviewController)
routerProducts.post('/', authenticateToken, isAdmin, customUploadMiddleware, createProductController)
routerProducts.put('/:id', authenticateToken, isAdmin, customUploadMiddleware, updateProductController)
routerProducts.delete('/:id', authenticateToken, isAdmin, deleteProductController)
export default routerProducts
