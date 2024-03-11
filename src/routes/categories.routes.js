import { Router } from 'express'
import {
  createCategoryController,
  deleteCategoryController,
  getCategoryController,
  getallCategoryController,
  updateCategoryController
} from '~/controllers/categories.controller'
import { authenticateToken, isAdmin } from '~/middlewares/auth.middlewares'

const routerCateogries = Router()

routerCateogries.get('/', getallCategoryController)
routerCateogries.get('/:id', getCategoryController)
routerCateogries.post('/', authenticateToken, isAdmin, createCategoryController)
routerCateogries.put('/:id', authenticateToken, isAdmin, updateCategoryController)
routerCateogries.delete('/:id', authenticateToken, isAdmin, deleteCategoryController)

export default routerCateogries
