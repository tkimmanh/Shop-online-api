import { Schema, model } from 'mongoose'

const billSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Orders',
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    bank: {
      type: String,
      required: true
    },
    bankTransactionId: {
      type: String,
      required: true
    },
    cardType: {
      type: String,
      required: true
    },
    orderInfo: {
      type: String,
      required: true
    },
    paymentDate: {
      type: String,
      required: true
    },
    transactionId: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
)

const Bill = model('Bill', billSchema)

export default Bill
