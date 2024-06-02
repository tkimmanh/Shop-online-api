const express = require('express')
import { config } from 'dotenv'
import cors from 'cors'
import { Server } from 'socket.io'
import { createServer } from 'node:http'
import connect from './config/dbConnect'
import routerProducts from './routes/products.routes'
import routerCateogries from './routes/categories.routes'
import routerSizes from './routes/Sizes.routes'
import routerColors from './routes/colors.routes'
import routerUsers from './routes/users.routes'
import routerOrder from './routes/orders.routes'
import couponRouter from '~/routes/coupons.routes'
import routerTopics from './routes/topics.routes'
import routerPosts from './routes/posts.routes'
import routerComments from './routes/comments.routes'
import notificationRouter from './routes/notification.routes'
import routerBill from './routes/bill.routes'

config()
const app = express()
const httpServer = createServer(app)

const userSockets = new Map() // tạo một map để lưu trữ thông tin của user và socketId

const io = new Server(httpServer, {
  cors: {}
})

app.set('io', io) // lưu trữ biến io vào trong app để sử dụng ở những file khác
app.set('userSockets', userSockets)

connect()

io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId
  userSockets.set(userId, socket.id)
  socket.on('disconnect', () => {
    userSockets.delete(userId)
  })
})

app.use(express.json())
app.use(cors({}))
app.use(express.urlencoded({ extended: true }))

app.use('/user', routerUsers)
app.use('/products', routerProducts)
app.use('/category', routerCateogries)
app.use('/sizes', routerSizes)
app.use('/colors', routerColors)
app.use('/order', routerOrder)
app.use('/coupon', couponRouter)
app.use('/topics', routerTopics)
app.use('/posts', routerPosts)
app.use('/bill', routerBill)
app.use('/notify', notificationRouter)
app.use('/comments', routerComments)

httpServer.listen(process.env.LOCAL_PORT, () => {
  console.log(`Server is running on PORT ${process.env.LOCAL_PORT}`)
})
