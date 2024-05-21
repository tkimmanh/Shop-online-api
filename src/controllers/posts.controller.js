import Posts from "~/models/Posts.model";
import HTTP_STATUS from "~/constants/httpStatus";
import { COMMENTS_MESSAGE, POSTS_MESSAGE } from "~/constants/message";
import Topics from "~/models/Topics.model";
import slugify from "slugify";
import Post from "~/models/Posts.model";
import { deleteImageOnCloudinary } from "~/utils/cloudinary";
import Comments from "~/models/Comments.model";

export const createPostController = async (req, res) => {
    try {
        const { title, content, author, topic } = req.body;

        if (!title || !content || !author || !topic) {
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                message: POSTS_MESSAGE.POSTS_IS_REQUIRED
            })
        }

        const postExists = await Posts.findOne({ title })
        if (postExists) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                message: 'Bài viết đã tồn tại!'
            })
        }

        const thumbnail = req?.files?.thumbnail && {
            url: req?.files?.thumbnail[0].path,
            public_id: req.files.thumbnail[0].filename
        }

        const newPost = await Posts.create({
            ...req.body,
            slug: slugify(title),
            thumbnail,

        })
        if (newPost) {
            return res.status(HTTP_STATUS.OK).json({
                message: POSTS_MESSAGE.POSTS_CREATED,
                newPost
            });
        }
    } catch (error) {
        console.log('error', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            message: POSTS_MESSAGE.POSTS_CREATED_FAILED
        })
    }
};

export const getAllPostController = async (req, res) => {
    try {
        const posts = await Post.find({})
            .populate('author', 'full_name')
            .populate('topic', 'name')
            .populate('comment', 'comment_content')
        if (posts) {
            return res.status(HTTP_STATUS.OK).json({
                message: POSTS_MESSAGE.POSTS_GET_ALL,
                posts
            });
        }
    } catch (error) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            message: POSTS_MESSAGE.POST_GET_ERROR
        })
    }
}

export const postDetailController = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
            message: POSTS_MESSAGE.POSTS_NOT_FOUND
        });
    }

    try {
        const post = await Posts.findById(id)
            .populate('topic', '-description -createdAt -updatedAt -__v')
            .populate('author', 'full_name')
            .populate({
                path: 'comment',
                select: 'content',
                populate: {
                    path: 'author',
                    select: 'full_name'
                }
            });

        if (!post) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                message: POSTS_MESSAGE.POSTS_NOT_FOUND
            });
        }

        // Lấy danh sách các comment của bài viết
        const comments = await Comments.find({ post: post._id })
            .populate('author', 'full_name')
            .select('content author createdAt');

        // Thêm danh sách comment vào thông tin chi tiết bài viết
        post.comment = comments;

        return res.status(HTTP_STATUS.OK).json({
            message: POSTS_MESSAGE.POST_GET_DETAILS,
            post
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            message: POSTS_MESSAGE.POST_GET_ERROR
        });
    }
};


export const comment = async (req, res) => {
    try {
        const { content, postId } = req.body;

        if (!content || !postId) {
            return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
                message: COMMENTS_MESSAGE.COMMENTS_IS_REQUIRED
            });
        }

        const postExists = await Posts.findById(postId);

        if (!postExists) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                message: COMMENTS_MESSAGE.COMMENTS_NOT_FOUND
            });
        }

        const newComment = await Comments.create({
            content,
            author: req.user._id,
            post: postId
        });

        if (newComment) {
            return res.status(HTTP_STATUS.OK).json({
                message: COMMENTS_MESSAGE.COMMENTS_CREATED,
                newComment
            });
        }
    } catch (error) {
        console.error('Error:', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            message: COMMENTS_MESSAGE.COMMENTS_CREATED_FAILED
        });
    }
};

export const updatePostController = async (req, res) => {
    const { id } = req.params

    if (!id) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
            message: POSTS_MESSAGE.POSTS_NOT_FOUND
        })
    }
    try {
        const postToUpdate = await Posts.findById(id)
        if (!postToUpdate) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                message: POSTS_MESSAGE.POSTS_NOT_FOUND
            });
        }
        if (req.files?.thumbnail && postToUpdate.thumbnail?.public_id) {
            await deleteImageOnCloudinary(postToUpdate?.thumbnail.public_id)
        }

        if (req.body.title) {
            req.body.slug = slugify(req.body.title)
        }
        //thêm thumbnail mới

        const updatedThumbnail = req.files?.thumbnail
            ? {
                url: req.files.thumbnail[0].path,
                public_id: req.files.thumbnail[0].filename
            }
            : postToUpdate.thumbnail


        const updatePost = await Posts.findOneAndUpdate(
            { _id: id },
            { ...req.body, thumbnail: updatedThumbnail },
            { new: true }
        )
        if (updatePost) {
            return res.status(HTTP_STATUS.OK).json({
                message: POSTS_MESSAGE.POST_UPDATED,
                updatePost
            })
        }
    } catch (error) {
        console.log('error:', error)
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            message: POSTS_MESSAGE.POSTS_UPDATE_ERROR
        })
    }
}
export const postDeleteController = async (req, res) => {
    const { id } = req.params

    if (!id) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            message: POSTS_MESSAGE.POSTS_NOT_FOUND
        })
    }
    try {
        const post = await Posts.findById(id)

        if (!post) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                message: POSTS_MESSAGE.POSTS_NOT_FOUND
            })
        }

        if (post.thumbnail && post.thumbnail.public_id) {
            await deleteImageOnCloudinary(post.thumbnail.public_id)
        }


        const postDelete = await Posts.findByIdAndDelete(id)

        if (postDelete) {
            res.status(HTTP_STATUS.OK).json({
                message: POSTS_MESSAGE.POST_DELETED,
                postDelete
            })
        }
    } catch (error) {
        console.log('error:', error)
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            message: POSTS_MESSAGE.POST_DELETED_FAILED
        })
    }
}
