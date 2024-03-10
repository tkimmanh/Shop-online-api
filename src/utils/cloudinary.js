import cloudinary from '~/config/cloudinary.config'

export const deleteImageOnCloudinary = async (publicId) => {
  if (!publicId) return
  try {
    await cloudinary?.uploader.destroy(publicId)
  } catch (error) {
    console.error('Error deleting image on Cloudinary:', error)
    throw error
  }
}
