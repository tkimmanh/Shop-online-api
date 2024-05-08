import Topics from "~/models/Topics.model";
import HTTP_STATUS from "~/constants/httpStatus";
import { TOPIC_MESSAGE } from "~/constants/message";

export const createTopicController = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
                message: TOPIC_MESSAGE.TOPIC_IS_REQUIRED
            })
        }
        const newTopic = await Topics.create(req.body)
        if (newTopic) {
            return res.status(HTTP_STATUS.OK).json({
                message: TOPIC_MESSAGE.TOPIC_CREATED,
                newTopic
            })
        }
    } catch (error) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            message: TOPIC_MESSAGE.TOPIC_CREATE_FAILED
        })
    }
}

export const getAllTopicController = async (req, res, next) => {
    try {
        const getAllTopic = await Topics.find({})

        if (getAllTopic) {
            return res.status(HTTP_STATUS.OK).json({
                message: TOPIC_MESSAGE.TOPIC_GET_ALL,
                getAllTopic
            })
        }
    } catch (error) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            message: TOPIC_MESSAGE.TOPIC_GET_ALL_FAILED
        });
    }
}

export const updateTopicController = async (req, res) => {
    const { id } = req.params;
    if (!req.body) {
        return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
            message: TOPIC_MESSAGE.TOPIC_IS_REQUIRED
        });
    }
    if (!id) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            message: TOPIC_MESSAGE.TOPIC_IS_NOT_FOUND
        });
    }
    try {
        const updatedTopic = await Topics.findByIdAndUpdate(id, req.body, {
            new: true
        });
        if (updatedTopic) {
            return res.status(HTTP_STATUS.OK).json({
                message: TOPIC_MESSAGE.TOPIC_UPDATED,
                updatedTopic
            });
        }
    } catch (error) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            message: TOPIC_MESSAGE.TOPIC_UPDATE_FAILED
        });
    }
}

export const deleteTopicController = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            message: TOPIC_MESSAGE.TOPIC_IS_NOT_FOUND
        })
    }
    try {
        const deleteTopic = await Topics.findByIdAndDelete(id);
        if (deleteTopic) {
            return res.status(HTTP_STATUS.OK).json({
                message: TOPIC_MESSAGE.TOPIC_DELETED,
                deleteTopic
            })
        }
    } catch (error) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            message: TOPIC_MESSAGE.TOPIC_UPDATE_FAILED
        });
    }
};
export const getOneTopicController = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            message: TOPIC_MESSAGE.TOPIC_IS_NOT_FOUND
        })
    }
    try {
        const getOneTopic = await Topics.findById(id)
        if (getOneTopic) {
            return res.status(HTTP_STATUS.OK).json({
                message: TOPIC_MESSAGE.TOPIC_GET_ONE,
                getOneTopic
            })
        }
    } catch (error) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            message: TOPIC_MESSAGE.TOPIC_UPDATE_FAILED
        });
    }
};