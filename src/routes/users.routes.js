import { Router } from 'express'
import { createUserController, signInController } from '~/controllers/users.controller'

const routerUsers = Router()

routerUsers.post('/register', createUserController)
routerUsers.post('/sigin', signInController)

export default routerUsers
