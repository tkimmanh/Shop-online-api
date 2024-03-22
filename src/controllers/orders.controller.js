import { VNPay } from 'vnpay'
import HTTP_STATUS from '~/constants/httpStatus'
import { USER_MESSAGE } from '~/constants/message'
import { default as Orders } from '~/models/Order.model'
import Products from '~/models/Products.model'
import Revenues from '~/models/Revenues.model'
import { default as Users } from '~/models/Users.model'

export const placeOrderController = async (req, res) => {
  const { _id } = req.user
  const { payment_method, address, phone, full_name } = req.body

  try {
    let user = await Users.findById(_id)
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: USER_MESSAGE.USER_NOT_FOUND
      })
    }
    if (user.cart.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Giỏ hàng của bạn đang trống.'
      })
    }
    let updateInfo = {}
    if (!user.address && address) updateInfo.address = address
    if (!user.phone && phone) updateInfo.phone = phone
    if (!user.full_name && full_name) updateInfo.full_name = full_name

    if (Object.keys(updateInfo).length > 0) {
      user = await Users.findByIdAndUpdate(_id, updateInfo, { new: true })
    }
    // Tính toán tổng tiền
    let totalPrice = 0
    for (const item of user.cart) {
      const product = await Products.findById(item.product)
      if (product) {
        totalPrice += product.price * item.quantity
      }
    }
    const newOrder = await Orders.create({
      user: _id,
      products: user.cart,
      total_price: totalPrice,
      payment_method
    })
    if (payment_method === 'Thanh toán bằng thẻ tín dụng') {
      const vnpay = new VNPay({
        tmnCode: '8F1UD35C',
        secureSecret: 'KLWBJBXARMRZQIMXBFFNSZUHJLNHRDWK'
      })
      const returnUrl = `http://localhost:3001/payment-success`
      const urlString = vnpay.buildPaymentUrl({
        vnp_Amount: totalPrice,
        vnp_IpAddr: '1.1.1.1',
        vnp_TxnRef: newOrder._id.toString(),
        vnp_OrderInfo: `Thanh toán đơn hàng `,
        vnp_OrderType: 'other',
        vnp_ReturnUrl: returnUrl
      })
      return res.json({ paymentUrl: urlString })
    }

    user.cart = []
    await user.save()

    res.status(HTTP_STATUS.OK).json({
      message: 'Đặt hàng thành công'
    })
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Có lỗi xảy ra',
      error: error.message
    })
  }
}
export const paymentSuccessController = async (req, res) => {
  var vnp_Params = req.query
  var orderId = vnp_Params['vnp_TxnRef']

  const order = await Orders.findById(orderId)
  if (order) {
    order.status_payment = 'Đã thanh toán bằng thẻ tín dụng'
    await order.save()
    const user = await Users.findById(order.user)
    if (user) {
      user.cart = []
      await user.save()
    }
  } else {
    res.status(HTTP_STATUS.NOT_FOUND).send('Đơn hàng không tồn tại')
  }
}
export const listUserOrdersController = async (req, res) => {
  try {
    const orders = await Orders.find()
      .populate({
        path: 'user',
        select: 'phone full_name address'
      })
      .populate({
        path: 'products.product',
        model: 'Products',
        populate: {
          path: 'category',
          model: 'Categories',
          select: 'title -_id'
        },
        select: '-colors -sizes -_id -sold'
      })
      .populate({
        path: 'products.color',
        model: 'Colors',
        select: 'name -_id'
      })
      .populate({
        path: 'products.size',
        model: 'Sizes',
        select: 'name -_id'
      })

    res.status(HTTP_STATUS.OK).json({
      message: 'Danh sách đơn hàng đã đặt',
      orders
    })
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Có lỗi xảy ra',
      error: error.message
    })
  }
}
export const cancelOrderController = async (req, res) => {
  const { id } = req.params
  const { _id } = req.user
  const { status } = req.body

  const statusUserUpdateOrder = ['Tiếp tục mua hàng', 'Đã hủy']

  if (!statusUserUpdateOrder.includes(status)) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Trạng thái không hợp lệ.'
    })
  }

  try {
    const order = await Orders.findById(id)
    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: 'Đơn hàng không tồn tại.'
      })
    }

    if (order.user?.toString() !== _id?.toString()) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: 'Bạn không có quyền hủy đơn hàng này.'
      })
    }
    order.status = status

    res.status(HTTP_STATUS.OK).json({
      message: `Đơn hàng của bạn đã được cập nhật thành "${status}" thành công.`,
      order
    })

    await order.save()
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Có lỗi xảy ra khi cập nhật trạng thái đơn hàng.',
      error: error.message
    })
  }
}

export const deleteOrderController = async (req, res) => {
  const { id } = req.params
  const { _id } = req.user
  try {
    const order = await Orders.findById(id)
    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: 'Đơn hàng không tồn tại.'
      })
    }

    if (order?.user?.toString() !== _id?.toString()) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: 'Bạn không có quyền xóa đơn hàng này.'
      })
    }

    await Orders.findByIdAndDelete(id)

    res.status(HTTP_STATUS.OK).json({
      message: 'Đơn hàng đã được xóa thành công.'
    })
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Có lỗi xảy ra khi xóa đơn hàng.',
      error: error.message
    })
  }
}

export const getAllOrdersForAdminController = async (req, res) => {
  const { sort, search } = req.query
  let sortOptions = {}
  if (sort === 'newest') {
    sortOptions.createdAt = -1
  } else if (sort === 'oldest') {
    sortOptions.createdAt = 1
  }

  let searchOptions = {}
  if (search) {
    searchOptions = {
      $or: [
        { 'user.full_name': { $regex: search, $options: 'i' } },
        { 'user.email': { $regex: search, $options: 'i' } }
      ]
    }
  }

  try {
    const orders = await Orders.find(searchOptions)
      .populate({
        path: 'user',
        select: 'full_name email phone address'
      })
      .populate({
        path: 'products.product',
        select: 'title price',
        populate: {
          path: 'category',
          model: 'Categories',
          select: 'title -_id'
        }
      })
      .populate('products.color', 'name color_code -_id')
      .populate('products.size', 'name -_id')
      .sort(sortOptions)

    res.status(HTTP_STATUS.OK).json({
      message: 'Lấy tất cả đơn hàng thành công.',
      orders
    })
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Có lỗi xảy ra khi lấy thông tin đơn hàng.',
      error: error.message
    })
  }
}
export const updateOrderStatusByAdminController = async (req, res) => {
  const { id } = req.params
  const { status } = req.body

  try {
    const order = await Orders.findById(id).populate('products.product')
    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: 'Đơn hàng không tồn tại.'
      })
    }

    order.status = status
    await order.save()

    if (status === 'Giao hàng thành công') {
      for (const item of order.products) {
        const product = await Products.findById(item.product)
        if (product) {
          product.quantity -= item.quantity
          product.sold += item.quantity
          await product.save()
        }
      }
    }

    res.status(HTTP_STATUS.OK).json({
      message: `Trạng thái đơn hàng của khách hàng đã được cập nhật thành "${status}".`,
      order
    })
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Có lỗi xảy ra khi cập nhật trạng thái đơn hàng.',
      error: error.message
    })
  }
}
export const calculateAnnualRevenueController = async (req, res) => {
  const year = new Date().getFullYear()
  try {
    // Tính toán doanh thu cho mỗi tháng và lưu vào database
    for (let month = 1; month <= 12; month++) {
      const startOfMonth = new Date(year, month - 1, 1)
      const endOfMonth = new Date(year, month, 0)

      const monthlyOrders = await Orders.find({
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        status: { $ne: 'Đã hủy' } // Loại bỏ đơn hàng đã hủy nếu cần
      }).select('-_id -createdAt -updatedAt -__v') // Loại bỏ các trường không mong muốn

      let monthlyRevenue = 0
      monthlyOrders.forEach((order) => {
        monthlyRevenue += order.total_price
      })

      // Cập nhật hoặc tạo mới bản ghi doanh thu
      await Revenues.findOneAndUpdate(
        { year, month },
        { $set: { totalRevenue: monthlyRevenue } },
        { upsert: true, new: true }
      ).select('-_id -createdAt -updatedAt -__v') // Loại bỏ các trường không mong muốn khi trả về dữ liệu
    }

    // Trả về doanh thu hàng tháng
    const revenues = await Revenues.find({ year }).sort({ month: 1 }).select('-_id -createdAt -updatedAt -__v') // Loại bỏ các trường không mong muốn
    res.status(HTTP_STATUS.OK).json({
      message: 'Lấy doanh thu hàng tháng trong năm thành công',
      revenues
    })
  } catch (error) {
    console.error('Lỗi khi tính toán doanh thu hàng tháng: ', error)
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Có lỗi xảy ra khi lấy doanh thu hàng tháng',
      error: error.message
    })
  }
}
