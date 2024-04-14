import { VNPay } from 'vnpay'
import HTTP_STATUS from '~/constants/httpStatus'
import { USER_MESSAGE } from '~/constants/message'
import { messageOrder } from '~/constants/messageOrder'
import Coupons from '~/models/Coupons.model'
import { default as Orders } from '~/models/Order.model'
import Products from '~/models/Products.model'
import Revenues from '~/models/Revenues.model'
import { default as Users } from '~/models/Users.model'
import dayjs from 'dayjs'

export const placeOrderController = async (req, res) => {
  const { _id } = req.user
  const { payment_method, address, phone, full_name, coupon_code } = req.body
  let discount = 0
  try {
    let user = await Users.findById(_id)
    if (!user.address || !user.phone || !user.full_name) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        message: 'Vui lòng cập nhật thông tin cá nhân trước khi đặt hàng.'
      })
    }
    if (coupon_code) {
      const coupon = await Coupons.findOne({
        code: coupon_code,
        is_active: true,
        expiration_date: { $gte: new Date() }
      })
      if (!coupon) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'Coupon không hợp lệ hoặc đã hết hạn.'
        })
      }
      discount = coupon.discount
    }
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
    let isOutOfStock = false
    let isQuantityExceeded = false
    for (const item of user.cart) {
      const product = await Products.findById(item.product)
      if (product) {
        if (product.quantity < item.quantity) {
          isOutOfStock = true
          break
        }
        if (item.quantity > product.quantity) {
          isQuantityExceeded = true
          break
        }
        totalPrice += product.price * item.quantity
      }
    }

    if (isOutOfStock) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Sản phẩm hiện đã hết hàng.'
      })
    }

    if (isQuantityExceeded) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Số lượng sản phẩm yêu cầu vượt quá số lượng có sẵn.'
      })
    }
    if (discount > 0) {
      totalPrice = totalPrice - (totalPrice * discount) / 100
    }

    const newOrder = await Orders.create({
      user: _id,
      products: user.cart,
      total_price: totalPrice,
      discount: discount > 0 ? discount : undefined,
      coupon: coupon_code || undefined
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
      message: messageOrder.ORDER_START
    })
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Có lỗi xảy ra',
      error: error.message
    })
  }
}
export const applyCouponController = async (req, res) => {
  const { coupon_code, cartItems } = req.body
  try {
    const coupon = await Coupons.findOne({
      code: coupon_code,
      is_active: true,
      expiration_date: { $gte: new Date() }
    })
    if (!coupon) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Coupon không hợp lệ hoặc đã hết hạn.'
      })
    }
    let totalPrice = 0
    for (const item of cartItems) {
      const product = await Products.findById(item.product)
      if (product) {
        totalPrice += product.price * item.quantity
      }
    }
    const discount = coupon.discount
    const discountedPrice = totalPrice - (totalPrice * discount) / 100

    return res.status(HTTP_STATUS.OK).json({
      message: 'Áp dụng mã giảm giá thành công.',
      totalPrice: discountedPrice,
      discount
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
  const { _id } = req.user
  try {
    const orders = await Orders.find({ user: _id })
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
export const getOrderDetailController = async (req, res) => {
  const { id } = req.params
  try {
    const order = await Orders.findById(id)
      .populate({
        path: 'user',
        select: 'full_name email phone address'
      })
      .populate({
        path: 'products.product',
        select: 'title price description',
        populate: {
          path: 'category',
          model: 'Categories',
          select: 'title -_id'
        }
      })
      .populate('products.color', 'name color_code -_id')
      .populate('products.size', 'name -_id')

    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: 'Đơn hàng không tồn tại.'
      })
    }

    res.status(HTTP_STATUS.OK).json({
      message: 'Thông tin chi tiết đơn hàng.',
      order
    })
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Có lỗi xảy ra khi lấy thông tin chi tiết đơn hàng.',
      error: error.message
    })
  }
}
export const updateOrderUserController = async (req, res) => {
  const { id } = req.body
  const { _id } = req.user
  const { status } = req.body

  try {
    const order = await Orders.findByIdAndUpdate(id, { status: status }, { new: true })
    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: 'Đơn hàng không tồn tại.'
      })
    }
    if (order.status === messageOrder.USER_RETURN_ORDER) {
      const month = order.createdAt.getMonth() + 1
      const year = order.createdAt.getFullYear()

      const revenueRecord = await Revenues.findOne({ year, month })
      if (revenueRecord) {
        revenueRecord.total_revenue -= order.total_price
        await revenueRecord.save()
      }
    }

    if (order.user?.toString() !== _id?.toString()) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        message: 'Bạn không có quyền hủy đơn hàng này.'
      })
    }

    if (order.status === messageOrder.ORDER_PEDDING) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Không thể cập nhật trạng thái đơn hàng khi đang giao.'
      })
    }
    if (
      status === messageOrder.USER_RETURN_ORDER &&
      (!order.deliveredAt || dayjs().diff(dayjs(order.deliveredAt), 'day') > 3)
    ) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Không thể trả hàng sau 3 ngày kể từ khi nhận hàng.'
      })
    }
    await order.save()

    return res.status(HTTP_STATUS.OK).json({
      message: `Đơn hàng của bạn đã được cập nhật thành "${status}" thành công.`,
      order
    })
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
    const notAllowedStatuses = [
      messageOrder.CANCEL_ORDER_FAIL,
      messageOrder.ORDER_WAIT_CONFIRM,
      messageOrder.ORDER_PEDDING
    ]
    if (notAllowedStatuses.includes(order?.status)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Không thể xóa đơn hàng lúc này'
      })
    }
    await Orders.findOneAndDelete({ _id: id })

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
    if (order.status === messageOrder.ORDER_SUCESS) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Không thể cập nhật trạng thái đơn hàng khi đã giao hàng thành công.'
      })
    }
    if (order.status === messageOrder.ORDER_WAIT_CONFIRM && status !== messageOrder.ORDER_CONFIRM) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Đơn hàng chờ xác nhận chỉ có thể chuyển sang đã xác nhận đơn hàng.'
      })
    }

    if (order.status === messageOrder.ORDER_CONFIRM && status !== messageOrder.ORDER_PEDDING) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Đơn hàng đã xác nhận chỉ có thể chuyển sang đang giao.'
      })
    }

    if (
      order.status === messageOrder.ORDER_PEDDING &&
      (status === messageOrder.ORDER_WAIT_CONFIRM || status === messageOrder.ORDER_CONFIRM)
    ) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Đơn hàng đang giao không thể chuyển về trạng thái chờ xác nhận hoặc đã xác nhận.'
      })
    }
    order.status = status
    if (status === messageOrder.ORDER_SUCESS) {
      order.deliveredAt = new Date()
      for (const item of order.products) {
        const product = await Products.findById(item.product)
        if (product) {
          product.quantity -= item.quantity
          product.sold += item.quantity
          await product.save()
        }
      }
    }

    if (status === messageOrder.USER_RETURN_ORDER) {
      if (!order.deliveredAt || dayjs().diff(dayjs(order.deliveredAt), 'day') > 3) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'Không thể trả hàng sau 3 ngày kể từ khi nhận hàng.'
        })
      }
    }

    await order.save()

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
    for (let month = 1; month <= 12; month++) {
      const startOfMonth = new Date(year, month - 1, 1)
      const endOfMonth = new Date(year, month, 0)

      const aggregationResult = await Orders.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfMonth, $lte: endOfMonth },
            status: messageOrder.ORDER_SUCESS
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$total_price' }
          }
        }
      ])

      let monthlyRevenue = 0
      if (aggregationResult.length > 0) {
        monthlyRevenue = aggregationResult[0].totalRevenue
      }

      await Revenues.findOneAndUpdate(
        { year, month },
        { $set: { total_revenue: monthlyRevenue } },
        { upsert: true, new: true }
      )
    }

    const revenues = await Revenues.find({ year }).sort({ month: 1 })

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
