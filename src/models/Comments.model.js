import { Schema, model } from 'mongoose';

const commentsSchema = new Schema(
  {
    content: 
      {
        type: String,
        required: true,
      }
    ,
    author: {
      type: Schema.Types.ObjectId,
      ref: 'Users',
      required: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Posts',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Comments = model('Comments', commentsSchema);

export default Comments;
