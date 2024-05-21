import { Schema, model } from 'mongoose';

const likeSchema = new Schema(
    {
        author: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        post: {
            type: Schema.Types.ObjectId,
            ref: 'Post',
            required: true,
        },
        type: {
            type: String,
            enum: ['like', 'dislike'],
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const Like = model('Like', likeSchema);

export default Like;
