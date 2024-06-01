import { Schema, model } from 'mongoose'

const postSchema = new Schema(
  {
    title: {
      type: String,
      required: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    content: {
      type: String,
      required: true
    },
    thumbnail: {
      url: String,
      public_id: String
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'Users',
      required: true
    },
    topic: {
      type: Schema.Types.ObjectId,
      ref: 'Topics',
      required: true
    },
    comment: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Comments',
        required: true
      }
    ]
    // like: {
    //   type: Schema.Types.ObjectId,
    //   ref: 'Likes',
    //   required: true,
    // },
  },
  {
    timestamps: true
  }
)

const Post = model('Post', postSchema)

export default Post
