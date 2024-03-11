import { Schema, model } from 'mongoose'

const colorsSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    color_code: {
      type: String
    },
    quantity: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
)

const Colors = model('Colors', colorsSchema)

export default Colors
