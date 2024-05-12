import HTTP_STATUS from "~/constants/httpStatus";
import { COMMENTS_MESSAGE } from "~/constants/message";
import Comments from "~/models/Comments.model";

export const commentUpdateController = async (req, res) => {
    const { id } = req.params

    if (!req.body) {
        return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(
            { message: COMMENTS_MESSAGE.COMMENTS_IS_REQUIRED }
        )
    }
    if (!id) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json(
            { message: COMMENTS_MESSAGE.COMMENTS_NOT_FOUND }
        )
    }
    try {
        const updateComment = await Comments.findByIdAndUpdate(id, req.body, { new: true })
        if (updateComment) {
            return res.status(HTTP_STATUS.OK).json({
                message: COMMENTS_MESSAGE.COMMENT_UPDATED,
                updateComment
            });
        }
    } catch (error) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            message: COMMENTS_MESSAGE.COMMENT_UPDATED_FAILED
        });
    }
}

export const getOneCommentContrller = async (req, res) => {
    const { id } = req.params

    if (!id) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json(
            { message: COMMENTS_MESSAGE.COMMENTS_NOT_FOUND }
        )
    }
    try {
        const getOneComment = await Comments.findById(id)
            // .populate('author', 'full_name')
            // .populate('posts', 'title')
            
        if (getOneComment) {
            return res.status(HTTP_STATUS.OK).json({
                message: COMMENTS_MESSAGE.COMMENT_GET_DETAILS,
                getOneComment
            })
        }
    } catch (error) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            message: COMMENTS_MESSAGE.COMMENT_GET_ERROR
        });
    }
}

export const deleteCommentController = async (req, res) => {
    const { id } = req.params

    if (!id) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            message: COMMENTS_MESSAGE.COMMENTS_NOT_FOUND
        })
    }
    try {
        const deleteComment = await Comments.findByIdAndDelete(id)
        if (deleteComment) {
            return res.status(HTTP_STATUS.OK).json({
                message: COMMENTS_MESSAGE.COMMENT_DELETED,
                deleteComment
            })
        }
    } catch (error) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            message: COMMENTS_MESSAGE.COMMENT_DELETED_FAILED
        });
    }
}
export const getAllCommentController = async (req, res) => {
    try {
        const comments = await Comments.find()
        if (comments) {
            return res.status(HTTP_STATUS.OK).json({
                message: COMMENTS_MESSAGE.COMMENTS_GET_ALL,
                comments
            })
        }
    } catch (error) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            message: COMMENTS_MESSAGE.COMMENT_GET_ERROR
        })
    }
}