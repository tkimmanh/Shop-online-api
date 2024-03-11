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
      type: Schema.Types.ObjectId,
      ref: 'Categories',
      required: true
    },
    quantity: {
      type: Number
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
    colors: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Colors'
      }
    ],
    sizes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Sizes'
      }
    ]
  },
  { timestamps: true }
)
const Products = model('Products', productsSchema)

export default Products
