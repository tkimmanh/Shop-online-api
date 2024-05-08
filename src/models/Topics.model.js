import { Schema, model } from 'mongoose';

const topicsSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Topics = model('Topics', topicsSchema);

export default Topics;
