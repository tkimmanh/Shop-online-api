import Bill from '~/models/Bill.model'

export const getAllBillsController = async (req, res) => {
  const { orderId } = req.params
  try {
    const bills = await Bill.find({ orderId }).populate('orderId')
    if (!bills) return res.status(200).json({ message: 'Không tìm thấy bill' })
    return res.status(200).json(bills)
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách bill', error })
  }
}

export const getUserBillsUserController = async (req, res) => {
  try {
    const userId = req.user._id
    const bills = await Bill.find({ 'orderId.user': userId }).populate('orderId')
    res.status(200).json({
      bills
    })
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách bill của user', error })
  }
}
