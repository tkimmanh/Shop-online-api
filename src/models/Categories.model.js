import { Schema, model } from 'mongoose'

const categoriesSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
      index: true
    }
  },
  {
    timestamps: true
  }
)
const Categories = model('Categories', categoriesSchema)

export default Categories
