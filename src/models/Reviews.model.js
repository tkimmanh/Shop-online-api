import mongoose, { Schema } from 'mongoose'

const reviewSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Products',
      required: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'Users',
      required: true
    },
    star: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    }
  },
  { timestamps: true }
)

const Review = mongoose.model('Review', reviewSchema)

export default Review
