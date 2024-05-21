import { Router } from "express";
import {
    commentUpdateController,
    getOneCommentContrller,
    deleteCommentController,
    getAllCommentController,
    
} from "~/controllers/comments.controller";
import { authenticateToken, isAdmin } from "~/middlewares/auth.middlewares";

const routerComments = Router();

routerComments.get('/', getAllCommentController)
routerComments.put('/:id', authenticateToken, isAdmin, commentUpdateController)
routerComments.delete('/:id', authenticateToken, isAdmin, deleteCommentController)
routerComments.get('/:id', authenticateToken, isAdmin, getOneCommentContrller)

export default routerComments;