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
import { getStartEndOfDay, getStartEndOfMonth, getStartEndOfYear } from '~/utils/commons'
import mongoose from 'mongoose'
import TempTransactions from '~/models/TempTransaction.model'
import Colors from '~/models/Colors.models'
import Sizes from '~/models/Sizes.model'
import Notification from '~/models/Notification.model'
import Bill from '~/models/Bill.model'

export const placeOrderController = async (req, res) => {
  const { _id } = req.user
  const { payment_method, address, phone, full_name, coupon_code } = req.body
  let discount = 0
  try {
    let user = await Users.findById(_id).populate({
      path: 'cart.product'
    })

    if (!user.address || !user.phone || !user.full_name) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
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

    const orderItems = await Promise.all(
      user.cart.map(async (item) => {
        const color = item.color ? await Colors.findById(item.color) : null
        const size = item.size ? await Sizes.findById(item.size) : null

        return {
          product: item.product._id,
          name: item.product.title,
          price: item.product.price,
          image: item.product.thumbnail.url,
          quantity: item.quantity,
          color: item.color,
          size: item.size,
          color_name: color ? color.name : 'No Color',
          size_name: size ? size.name : 'No Size',
          category: item.product.category ? item.product.category._id : 'No Category'
        }
      })
    )

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
        item.product_details = {
          name: product.name,
          price: product.price
        }
      }
    }

    let productQuantities = {}
    user.cart.forEach((item) => {
      const key = item.product._id.toString()
      if (productQuantities[key]) {
        productQuantities[key] += item.quantity
      } else {
        productQuantities[key] = item.quantity
      }
    })

    // Kiểm tra số lượng tồn kho
    for (const [productId, totalQuantity] of Object.entries(productQuantities)) {
      const product = await Products.findById(productId)
      if (!product || product.quantity < totalQuantity) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: `Sản phẩm ${product.title} không đủ hàng. Chỉ còn lại ${product.quantity} sản phẩm.`
        })
      }
    }

    if (isOutOfStock) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Sản phẩm hiện đã không có đủ hàng.'
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

    if (payment_method === 'Thanh toán bằng thẻ tín dụng') {
      const transactionRef = new mongoose.Types.ObjectId()
      const tempCart = user.cart.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        color: item.color || null,
        size: item.size || null
      }))
      await TempTransactions.create({
        ref: transactionRef,
        user: _id,
        cart: tempCart,
        totalPrice: totalPrice,
        payment_method: 'Thanh toán khi nhận hàng',
        status: 'pending'
      })

      const vnpay = new VNPay({
        tmnCode: '8F1UD35C',
        secureSecret: 'KLWBJBXARMRZQIMXBFFNSZUHJLNHRDWK'
      })
      const returnUrl = `https://shop-online-client.vercel.app/payment-success`
      const urlString = vnpay.buildPaymentUrl({
        vnp_Amount: totalPrice,
        vnp_IpAddr: '1.1.1.1',
        vnp_TxnRef: transactionRef.toString(),
        vnp_OrderInfo: 'Thanh toán đơn hàng',
        vnp_OrderType: 'other',
        vnp_ReturnUrl: returnUrl
      })
      return res.json({ paymentUrl: urlString })
    }

    const newOrder = await Orders.create({
      user: _id,
      products: orderItems,
      total_price: totalPrice,
      discount: discount > 0 ? discount : undefined,
      coupon: coupon_code || '(Trống)'
    })

    if (newOrder) {
      for (const item of orderItems) {
        await Products.findByIdAndUpdate(item.product, { $inc: { quantity: -item.quantity } })
      }
    }

    user.cart = []

    await user.save()

    res.status(HTTP_STATUS.OK).json({
      message: messageOrder.ORDER_START,
      order: newOrder
    })
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Có lỗi xảy ra',
      error: error.message
    })
  }
}

export const paymentSuccessController = async (req, res) => {
  const vnp_Params = req.query
  const transactionRef = vnp_Params['vnp_TxnRef']
  const responseCode = vnp_Params['vnp_ResponseCode']
  console.log('params payment success', vnp_Params)
  try {
    if (responseCode !== '00') {
      return null
    }

    const tempTransaction = await TempTransactions.findOne({
      ref: transactionRef,
      status: 'pending'
    }).populate({
      path: 'cart.product'
    })

    if (!tempTransaction) {
      return null
    }

    const orderItems = await Promise.all(
      tempTransaction.cart.map(async (item) => {
        const color = item.color ? await Colors.findById(item.color) : null
        const size = item.size ? await Sizes.findById(item.size) : null

        return {
          product: item.product._id,
          name: item.product.title,
          price: item.product.price,
          image: item.product.thumbnail.url,
          quantity: item.quantity,
          color: item.color,
          size: item.size,
          color_name: color ? color.name : 'No Color',
          size_name: size ? size.name : 'No Size',
          category: item.product.category ? item.product.category._id : 'No Category'
        }
      })
    )

    const newOrder = await Orders.create({
      user: tempTransaction.user,
      products: orderItems,
      total_price: tempTransaction.totalPrice,
      payment_method: 'Thanh toán bằng thẻ tín dụng',
      status_payment: 'Đã thanh toán bằng thẻ tín dụng'
    })

    await Bill.create({
      orderId: newOrder._id,
      amount: tempTransaction.totalPrice,
      bank: vnp_Params['vnp_BankCode'],
      bankTransactionId: vnp_Params['vnp_BankTranNo'],
      cardType: vnp_Params['vnp_CardType'],
      orderInfo: vnp_Params['vnp_OrderInfo'],
      paymentDate: vnp_Params['vnp_PayDate'],
      transactionId: vnp_Params['vnp_TransactionNo']
    })

    if (newOrder) {
      for (const item of orderItems) {
        await Products.findByIdAndUpdate(item.product, { $inc: { quantity: -item.quantity } })
      }
    }

    await TempTransactions.findByIdAndUpdate(tempTransaction._id, {
      status: 'processed'
    })

    await Users.findByIdAndUpdate(tempTransaction.user, {
      $set: { cart: [] }
    })

    res.status(HTTP_STATUS.OK).json({
      message: 'Thanh toán thành công và đơn hàng đã được tạo.',
      order: newOrder
    })
  } catch (error) {
    console.log(error)
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Có lỗi xảy ra khi xử lý thanh toán thành công.',
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
    console.log('error:', error)
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Có lỗi xảy ra',
      error: error.message
    })
  }
}
export const listUserOrdersController = async (req, res) => {
  const { _id } = req.user
  const { status } = req.query

  let queryOptions = { user: _id }
  if (status) {
    if (status === messageOrder.USER_RETURN_ORDER) {
      queryOptions.status = {
        $in: [
          messageOrder.USER_RETURN_ORDER,
          messageOrder.REUTRN_ORDER_CONFIRM,
          messageOrder.RETURN_ORDER_WAIT_CONFIRM,
          messageOrder.RETURN_ORDER_SUCCESS,
          messageOrder.RETURN_ORDER_FAIL
        ]
      }
    } else if (status === messageOrder.CANCEL_ORDER) {
      queryOptions.status = {
        $in: [
          messageOrder.USER_CANCEL_ORDER,
          messageOrder.WRONG_USER_INFORMATION,
          messageOrder.ORDER_FAILED,
          messageOrder.ORDER_CONFIRM_FAIL_2,
          messageOrder.ORDER_CONFIRM_FAIL_1,
          messageOrder.ORDER_CONFIRM_FAIL
        ]
      }
    } else {
      queryOptions.status = status
    }
  }

  try {
    const orders = await Orders.find(queryOptions)
      .populate('user', 'phone full_name address email')
      .sort({ createdAt: -1 })

    orders.forEach((order) => {
      order.products = order.products.map((item) => {
        if (!item.product) {
          return {
            ...item,
            product: {
              title: 'Sản phẩm hiện đã không còn trong của hàng'
            }
          }
        }
        return item
      })
    })

    res.status(HTTP_STATUS.OK).json({
      message: 'Danh sách đơn hàng đã đặt',
      orders
    })
  } catch (error) {
    console.log('error:', error)
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Có lỗi xảy ra',
      error: error.message
    })
  }
}
export const getOrderDetailController = async (req, res) => {
  const { id } = req.params
  try {
    const order = await Orders.findById({ _id: id }).populate({
      path: 'user',
      select: 'phone full_name address email'
    })

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
    if (order.status === messageOrder.RETURN_ORDER_WAIT_CONFIRM) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: 'Đơn hàng đang được kiểm tra hiện tại không thể huỷ'
      })
    }

    if (order.user?.toString() !== _id?.toString()) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        message: 'Bạn không có quyền hủy đơn hàng này.'
      })
    }

    if (order.status === messageOrder.ORDER_SUCESS && status === messageOrder.USER_CANCEL_ORDER) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Không thể hủy đơn hàng sau khi đã giao hàng thành công.'
      })
    }
    if (order.status === messageOrder.ORDER_PEDDING) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Không thể cập nhật trạng thái đơn hàng khi đang giao.'
      })
    }

    if (status === messageOrder.USER_RETURN_ORDER) {
      if (dayjs().diff(dayjs(order.deliveredAt), 'day') > 3) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'Không thể trả hàng sau 3 ngày kể từ khi nhận hàng.'
        })
      }
    }
    if (status === messageOrder.USER_CANCEL_ORDER) {
      for (const item of order.products) {
        await Products.findByIdAndUpdate(item.product._id, { $inc: { quantity: item.quantity } })
      }
    }

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
      messageOrder.ORDER_PEDDING,
      messageOrder.USER_RETURN_ORDER,
      messageOrder.RETURN_ORDER_WAIT_CONFIRM
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
  const { search, status } = req.query
  let searchOptions = {}

  if (status) {
    searchOptions.status = status
  }

  if (search) {
    searchOptions = {
      $or: [
        { 'user.full_name': { $regex: search, $options: 'i' } },
        { 'user.email': { $regex: search, $options: 'i' } }
      ]
    }
  }
  if (search) {
    searchOptions._id = search
  }
  try {
    const orders = await Orders.find(searchOptions)
      .populate({
        path: 'user',
        select: 'full_name email phone address'
      })

      .sort({ createdAt: -1 })

    res.status(HTTP_STATUS.OK).json({
      message: 'Lấy tất cả đơn hàng thành công.',
      orders
    })
  } catch (error) {
    console.log('error:', error)
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Có lỗi xảy ra khi lấy thông tin đơn hàng.',
      error: error.message
    })
  }
}

export const getOrderCountsByStatusController = async (req, res) => {
  try {
    const counts = await Orders.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])

    res.status(HTTP_STATUS.OK).json({
      message: 'Số lượng đơn hàng theo trạng thái',
      counts
    })
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Có lỗi xảy ra khi lấy số lượng đơn hàng theo trạng thái.',
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
    if (order.status === messageOrder.RETURN_ORDER_SUCCESS) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Không thể cập nhật trạng thái đơn hàng đã hoàn thành'
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

    // nếu trả hàng thành công
    if (status === messageOrder.RETURN_ORDER_SUCCESS) {
      for (const item of order.products) {
        console.log(item)
        await Products.findByIdAndUpdate(item.product._id, { $inc: { quantity: item.quantity } })
      }
      const month = order.createdAt.getMonth() + 1
      const year = order.createdAt.getFullYear()
      await Revenues.findOneAndUpdate(
        { year, month },
        { $inc: { total_revenue: -order.total_price } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )

      order.deliveredAt = null
    }

    if (
      order.status === messageOrder.ORDER_PEDDING &&
      (status === messageOrder.ORDER_WAIT_CONFIRM || status === messageOrder.ORDER_CONFIRM)
    ) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Đơn hàng đang giao không thể chuyển về trạng thái chờ xác nhận hoặc đã xác nhận.'
      })
    }

    const previousStatus = order.status
    order.status = status

    //giao hàng thành công
    if (status === messageOrder.ORDER_SUCESS && previousStatus !== messageOrder.ORDER_SUCESS) {
      order.deliveredAt = new Date()
      const month = order.createdAt.getMonth() + 1
      const year = order.createdAt.getFullYear()

      await Revenues.findOneAndUpdate(
        { year, month },
        { $inc: { total_revenue: order.total_price } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    }

    if (order?.deliveredAt && dayjs().diff(dayjs(order.deliveredAt), 'day') > 3) {
      order.canReturn = false
      await order.save()
    }

    /*
     * Gửi thông báo cho người dùng khi trạng thái đơn hàng thay đổi
     */
    const firstProduct = order.products[0].product

    const io = req.app.get('io')
    const userSockets = req.app.get('userSockets')

    const notification = {
      user_id: order.user,
      product_title: firstProduct?.title,
      product_thumbnail: firstProduct?.thumbnail?.url,
      message: `Đơn hàng của bạn đã được cập nhật thành "${status}"`,
      read: false
    }

    const userSocketId = userSockets.get(order.user.toString())
    if (userSocketId) {
      io.to(userSocketId).emit('notification', notification)
    }
    io.emit('notification', notification)
    await Notification.create(notification)
    /*
     * Gửi thông báo cho người dùng khi trạng thái đơn hàng thay đổi
     */

    await order.save()

    res.status(HTTP_STATUS.OK).json({
      message: `Trạng thái đơn hàng của khách hàng đã được cập nhật thành "${status}".`,
      order
    })
  } catch (error) {
    console.log('error:', error)
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

      const monthlyOrders = await Orders.find({
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        status: { $ne: 'Đã hủy' } // Loại bỏ các đơn hàng đã hủy
      }).select('-_id -createdAt -updatedAt -__v')

      let monthlyRevenue = 0
      monthlyOrders.forEach((order) => {
        monthlyRevenue += order.total_price
      })

      await Revenues.findOneAndUpdate(
        { year, month },
        { $set: { totalRevenue: monthlyRevenue } },
        { upsert: true, new: true }
      ).select('-_id -createdAt -updatedAt -__v')
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

export const getTopSellingCategoriesController = async (req, res) => {
  try {
    const topSellingCategories = await Products.aggregate([
      {
        $group: {
          _id: '$category',
          totalSold: { $sum: '$sold' }
        }
      },
      {
        $sort: { totalSold: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryDetails'
        }
      },
      {
        $unwind: '$categoryDetails'
      }
    ])

    if (topSellingCategories.length > 0) {
      res.status(HTTP_STATUS.OK).json({
        message: 'Top 5 danh mục có sản phẩm bán chạy nhất.',
        categories: topSellingCategories
      })
    } else {
      return null
    }
  } catch (error) {
    console.error('Error fetching top selling categories:', error)
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Có lỗi xảy ra khi lấy danh sách các danh mục bán chạy nhất.',
      error: error.message
    })
  }
}

export const getTopSellingProductsController = async (req, res) => {
  const { period } = req.params
  const date = new Date(req.query.date || new Date())

  let startEnd
  if (period === 'day') {
    startEnd = getStartEndOfDay(date)
  } else if (period === 'month') {
    startEnd = getStartEndOfMonth(date)
  } else if (period === 'year') {
    startEnd = getStartEndOfYear(date)
  } else {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Invalid period specified. Choose from day, month, or year.'
    })
  }

  try {
    const topProducts = await Orders.aggregate([
      {
        $match: {
          createdAt: { $gte: startEnd.start, $lte: startEnd.end } // Lọc các đơn hàng theo ngày, tháng hoặc năm
        }
      },
      { $unwind: '$products' }, // Tách các sản phẩm trong đơn hàng thành các bản ghi riêng lẻ
      {
        $group: {
          _id: '$products.product',
          totalSold: { $sum: '$products.quantity' }
        }
      },
      {
        $sort: { totalSold: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      {
        $unwind: '$productDetails'
      }
    ])

    res.status(HTTP_STATUS.OK).json({
      message: `Top 5 selling products of the ${period}`,
      products: topProducts
    })
  } catch (error) {
    console.error('Error fetching top selling products:', error)
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Error fetching top selling products.',
      error: error.message
    })
  }
}

export const listReturnOrdersController = async (req, res) => {
  try {
    const returnStatuses = [
      messageOrder.USER_RETURN_ORDER,
      messageOrder.RETURN_ORDER_SUCCESS,
      messageOrder.RETURN_ORDER_FAIL,
      messageOrder.RETURN_ORDER_WAIT_CONFIRM,
      messageOrder.REUTRN_ORDER_CONFIRM
    ]
    // Sử dụng $in filer các có trạng thái nằm trong mảng trên
    const filteredOrders = await Orders.find({
      status: { $in: returnStatuses }
    })
      .populate({
        path: 'user',
        select: 'full_name email phone address'
      })

      .sort({ createdAt: -1 })

    return res.status(HTTP_STATUS.OK).json({
      message: 'Danh sách đơn hàng trả hàng.',
      orders: filteredOrders
    })
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Có lỗi xảy ra khi lấy danh sách đơn hàng trả hàng.',
      error: error.message
    })
  }
}
