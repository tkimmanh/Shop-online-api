import Notification from '~/models/Notification.model'
import HTTP_STATUS from '~/constants/httpStatus'

export const getUserNotificationsController = async (req, res) => {
  const userId = req.user._id
  try {
    const notifications = await Notification.find({ user_id: userId }).sort({ createdAt: -1 })

    res.status(HTTP_STATUS.OK).json({
      notifications
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Có lỗi xảy ra khi lấy thông báo.',
      error: error.message
    })
  }
}

export const createNotification = async (notificationData) => {
  const { user_id } = notificationData
  try {
    const notifications = await Notification.find({ user_id }).sort({ createdAt: -1 })
    // Kiểm tra và xóa thông báo cũ nhất nếu số lượng thông báo vượt quá 10
    if (notifications.length >= 10) {
      // Xóa thông báo cuối cùng trong mảng đã sắp xếp từ mới nhất đến cũ nhất
      await Notification.findByIdAndDelete(notifications[notifications.length - 1]._id)
    }
    const newNotification = new Notification(notificationData)

    await newNotification.save()
  } catch (error) {
    console.error('Error managing notifications:', error)
    throw error
  }
}

export const markNotificationAsReadController = async (req, res) => {
  const { notificationId } = req.params

  try {
    await Notification.findByIdAndUpdate(notificationId, { read: true })
    res.status(HTTP_STATUS.OK).json({
      message: 'Đã xem'
    })
  } catch (error) {
    console.error('Error updating notification:', error)
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Có lỗi xảy ra khi cập nhật thông báo.',
      error: error.message
    })
  }
}
