import { Schema, model } from 'mongoose'

const ordersSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'Users'
    },
    products: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: 'Products'
        },
        quantity: Number,
        color: {
          type: Schema.Types.ObjectId,
          ref: 'Colors'
        },
        size: {
          type: Schema.Types.ObjectId,
          ref: 'Sizes'
        },
        category: {
          type: Schema.Types.ObjectId,
          ref: 'Categories'
        }
      },
      { _id: false }
    ],
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
