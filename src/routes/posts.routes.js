import { Router } from "express";

import {
    createPostController,
    getAllPostController,
    postDetailController,
    updatePostController,
    postDeleteController,
    comment
} from "~/controllers/posts.controller";

import { authenticateToken, isAdmin } from "~/middlewares/auth.middlewares";
import { customUploadMiddleware } from "~/middlewares/uploadImage.middlewares";
const routerPosts = Router();

routerPosts.get('/', getAllPostController)
routerPosts.post('/', authenticateToken, isAdmin, customUploadMiddleware, createPostController)
routerPosts.post('/comment', authenticateToken, comment)
routerPosts.get('/:id', authenticateToken, isAdmin, customUploadMiddleware, postDetailController)
routerPosts.put('/:id', authenticateToken, isAdmin, customUploadMiddleware, updatePostController)
routerPosts.delete('/:id', authenticateToken, isAdmin, customUploadMiddleware, postDeleteController)

export default routerPosts;