import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId
  },
  message: String,
  read: {
    type: Boolean,
    default: false
  },
  product_title: {
    type: String,
    default: 'Khồn có title'
  },
  product_thumbnail: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const Notification = mongoose.model('Notification', notificationSchema)

export default Notification
