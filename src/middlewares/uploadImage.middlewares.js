import multer, { diskStorage } from 'multer'
import sharp from 'sharp'
import { join } from 'path'
import { unlinkSync } from 'fs'
const storage = diskStorage({
  destination: function (req, file, cb) {
    cb(null, join(__dirname, '../public/images/'))
  },
  filename: function (req, file, cb) {
    const uniquesuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, file.fieldname + '-' + uniquesuffix + '.jpeg')
  }
})

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true)
  } else {
    cb({ message: 'Tập tin không được hỗ trợ' }, false)
  }
}

export const uploadPhoto = multer({
  storage: storage,
  fileFilter: multerFilter,
  limits: { fileSize: 1000000 }
})

export const productImgResize = async (req, res, next) => {
  if (!req.files) return next()
  await Promise.all(
    req.files.map(async (file) => {
      await sharp(file.path)
        .resize(300, 300)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/images/products/${file.filename}`)
      unlinkSync(`public/images/products/${file.filename}`)
    })
  )
  next()
}
