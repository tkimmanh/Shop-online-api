import { default as mongoose } from 'mongoose'
import { config } from 'dotenv'
config()
const connect = () => {
  try {
    mongoose.connect(process.env.DB_MONGO_URL)
    console.log('Database Connected Successfully')
  } catch (error) {
    console.log('Database error')
  }
}
export default connect
