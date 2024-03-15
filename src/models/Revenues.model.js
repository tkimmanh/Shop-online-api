import { Schema, model } from 'mongoose'

const revenueSchema = new Schema(
  {
    year: {
      type: Number,
      required: true
    },
    month: {
      type: Number,
      required: true
    },
    total_revenue: {
      type: Number,
      required: true,
      default: 0
    }
  },
  { timestamps: true }
)

const Revenues = model('Revenues', revenueSchema)

export default Revenues
