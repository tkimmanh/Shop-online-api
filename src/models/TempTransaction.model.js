import mongoose from 'mongoose'

const tempTransactionSchema = new mongoose.Schema(
  {
    ref: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      required: true
    },
    cart: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Products'
        },
        color: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Colors'
        },
        size: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Sizes'
        },
        quantity: Number
      }
    ],
    totalPrice: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      default: 'pending',
      enum: ['pending', 'processed', 'failed']
    }
  },
  { timestamps: true }
)

const TempTransactions = mongoose.model('TempTransactions', tempTransactionSchema)

export default TempTransactions
