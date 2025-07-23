  import  { Op, Sequelize } from 'sequelize';
import  db from '../models'; 

async function getOrdersCount(vendor_id, order_status = '') {
  let whereClause = { vendor_id };

  if (order_status === 5) {
    whereClause['$Order.order_status$'] = { [Op.in]: [5, 11, 17] };
  } else if (order_status === 1) {
    whereClause['$Order.order_status$'] = { [Op.notIn]: [5, 11, 17] };
  } else {
    whereClause['$Order.order_status$'] = { [Op.in]: [5, 11, 17] };
  }

  const count = await db.OrderProduct.count({
    where: whereClause,
    include: [{
      model: db.Order,
      as: 'Order',
      attributes: [],
    }],
    distinct: true,
    col: 'order_id',
  });

  return count;
}
