import { Router } from 'express'
import {
  createCategoryController,
  deleteCategoryController,
  getCategoryController,
  getallCategoryController,
  updateCategoryController
} from '~/controllers/categories.controller'

const routerCateogries = Router()

routerCateogries.get('/', getallCategoryController)
routerCateogries.post('/', createCategoryController)
routerCateogries.get('/:id', getCategoryController)
routerCateogries.put('/:id', updateCategoryController)
routerCateogries.delete('/:id', deleteCategoryController)

export default routerCateogries
