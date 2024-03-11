import multer from 'multer'
import { upload } from '~/config/cloudinary.config'
import HTTP_STATUS from '~/constants/httpStatus'

export const customUploadMiddleware = (req, res, next) => {
  const uploadHandler = upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'images', maxCount: 5 }
  ])
  uploadHandler(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({ message: 'Lỗi upload ảnh' })
    } else if (err) {
      return res.status(500).json({ message: 'Server error during file upload' })
    }
    next()
  })
}
