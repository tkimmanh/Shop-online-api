import { Schema, model } from 'mongoose'

const cartSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Products',
    required: true
  },
  color: {
    type: Schema.Types.ObjectId,
    ref: 'Colors',
    required: false
  },
  size: {
    type: Schema.Types.ObjectId,
    ref: 'Sizes',
    required: false
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  }
})

const usersSchema = new Schema(
  {
    full_name: {
      type: String
    },
    email: {
      type: String,
      require: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      default: 'user',
      enum: ['admin', 'staff', 'user']
    },
    phone: {
      type: Number
    },
    address: {
      type: String
    },
    city: {
      type: String
    },
    wishlist: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Products',
        required: true
      }
    ],
    cart: [cartSchema],
    access_token: {
      type: String
    },
    deviceToken: {
      // sử dụng cho push notification
      type: String
    },
    refresh_token: {
      type: String
    }
  },
  {
    timestamps: true
  }
)
const Users = model('Users', usersSchema)

export default Users
