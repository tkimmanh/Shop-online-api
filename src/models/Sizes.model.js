import { Schema, model } from 'mongoose'

const sizesSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    }
  },
  { timestamps: true }
)

const Sizes = model('Sizes', sizesSchema)

export default Sizes
