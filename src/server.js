const express = require('express')
import { config } from 'dotenv'
import cors from 'cors'

import connect from './config/dbConnect'
import routerProducts from './routes/products.routes'
import routerCateogries from './routes/categories.routes'
import routerSizes from './routes/Sizes.routes'
import routerColors from './routes/colors.routes'
import routerUsers from './routes/users.routes'
import routerOrder from './routes/orders.routes'
import couponRouter from '~/routes/coupons.routes'
import routerTopics from './routes/topics.routes'

config()
const app = express()

connect()
app.use(express.json())
app.use(
  cors({
    origin: 'http://localhost:3001',
    credentials: true
  })
)
app.use(express.urlencoded({ extended: true }))

app.use('/user', routerUsers)
app.use('/products', routerProducts)
app.use('/category', routerCateogries)
app.use('/sizes', routerSizes)
app.use('/colors', routerColors)
app.use('/order', routerOrder)
app.use('/coupon', couponRouter)
app.use('/topic', routerTopics)

app.listen(process.env.LOCAL_PORT, () => {
  console.log(`Server is running on PORT ${process.env.LOCAL_PORT}`)
})
