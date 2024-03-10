import express from 'express'
import { config } from 'dotenv'
import connect from './config/dbConnect'
import cors from 'cors'

config()
const app = express()

connect()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.listen(process.env.LOCAL_PORT, () => {
  console.log(`Server is running on PORT ${process.env.LOCAL_PORT}`)
})
