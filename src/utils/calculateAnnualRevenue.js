import Orders from '~/models/Order.model'

async function calculateAnnualRevenue(year) {
  let monthlyRevenues = []
  for (let month = 0; month < 12; month++) {
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)

    const monthlyOrders = await Orders.aggregate([
      {
        $match: {
          status: 'Giao hàng thành công',
          updatedAt: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total_price' }
        }
      }
    ])

    const monthlyRevenue = monthlyOrders.length > 0 ? monthlyOrders[0].totalRevenue : 0
    monthlyRevenues.push({
      month: month + 1,
      revenue: monthlyRevenue
    })
  }
  return monthlyRevenues
}

export default calculateAnnualRevenue
