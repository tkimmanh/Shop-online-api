import { Schema, model } from 'mongoose'

const orderDetail = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Products'
    },
    name: String,
    price: Number,
    image: String,
    quantity: Number,
    color_name: String,
    size_name: String
  },
  { _id: false }
)

const ordersSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'Users'
    },
    products: [orderDetail],
    status: {
      type: String,
      default: 'Chờ xác nhận'
    },
    status_payment: {
      type: String,
      default: 'Thanh toán khi nhận hàng'
    },
    total_price: {
      type: Number
    },
    coupon: {
      type: String,
      default: ''
    },
    discount: {
      type: Number,
      default: 0
    },
    payment_method: {
      type: String,
      default: 'Thanh toán khi nhận hàng',
      enum: ['Thanh toán khi nhận hàng', 'Thanh toán bằng thẻ tín dụng']
    },
    deliveredAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
)

const Orders = model('Orders', ordersSchema)

export default Orders
