const express = require('express')
import { config } from 'dotenv'
import cors from 'cors'

import connect from './config/dbConnect'
import routerProducts from './routes/products.routes'

config()
const app = express()

connect()
app.use(express.json())
app.use(cors())
app.use(express.urlencoded({ extended: true }))
app.use('/products', routerProducts)
app.listen(process.env.LOCAL_PORT, () => {
  console.log(`Server is running on PORT ${process.env.LOCAL_PORT}`)
})
