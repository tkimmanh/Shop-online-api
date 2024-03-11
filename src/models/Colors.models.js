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
    }
  },
  { timestamps: true }
)

const Colors = model('Colors', colorsSchema)

export default Colors
