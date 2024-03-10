import { Schema, model } from 'mongoose'

const productsSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    description: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    category: {
      type: String
    },

    quantity: {
      type: Number,
      required: true
    },
    sold: {
      type: Number,
      default: 0
    },
    thumbnail: {
      url: String,
      public_id: String
    },
    status: {
      type: Boolean
    },
    images: [
      {
        public_id: String,
        url: String
      }
    ],
    color: []
  },
  { timestamps: true }
)
const Products = model('Products', productsSchema)

export default Products
