import { Router } from "express";
import {
    createTopicController,
    getAllTopicController,
    updateTopicController,
    deleteTopicController,
    getOneTopicController,
} from "~/controllers/topics.controller";
import { authenticateToken, isAdmin } from "~/middlewares/auth.middlewares";

const routerTopics = Router();

routerTopics.get('/', getAllTopicController)
routerTopics.post('/',authenticateToken, isAdmin, createTopicController)
routerTopics.put('/:id',authenticateToken, isAdmin, updateTopicController)
routerTopics.delete('/:id',authenticateToken, isAdmin, deleteTopicController)
routerTopics.get('/:id',authenticateToken, isAdmin, getOneTopicController)

export default routerTopics;