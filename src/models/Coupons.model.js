import { Schema, model } from 'mongoose'

const couponSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true
    },
    discount: {
      type: Number,
      required: true
    },
    expiration_date: {
      type: Date,
      required: true
    },
    is_active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
)

const Coupons = model('Coupons', couponSchema)

export default Coupons
