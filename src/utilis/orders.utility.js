import { Sequelize } from "sequelize";
import sequelize from "../db/connection.js";
export async function getAllOrders({vendor_id, order_status = '', limit = 10, start = 0}) {
    let whereCondition = '';

    if (order_status) {
        if (order_status == 5) {
            whereCondition = "WHERE `tord`.`order_status` IN (5, 11, 17)";
        } else if (order_status == 1) {
            whereCondition = "WHERE `tord`.`order_status` NOT IN (5, 11, 17)";
        }
    } else {
        whereCondition = "WHERE `tord`.`order_status` IN (5, 11, 17)";
    }

    const sql = `
    SELECT 
        top.order_product_id,
        top.product_id, 
        top.product_name, 
        top.gst_type, 
        top.qty,
        top.sub_total, 
        top.plan_details, 
        top.plan_variables, 
        top.plan_other_variables,
        orders.*,
        tpi.image,
        ops.delivery_type
    FROM tbl_order_product top 
    INNER JOIN (
        SELECT tord.order_id,
            tord.order_date,
            IF(tord.order_status >= 1, 1, 0) as order_placed, 
            IF(tord.order_status IN(3, 9, 15), 1, 0) as order_cancelled, 
            IF(po.approve_po = 1 OR tord.order_status IN(5, 11, 17), 1, 0) as po_generated,
            IF(tord.order_status IN(5, 11, 17), 1, 0) as order_delivered,
            po.po_number,
            po.doc_number,
            po.licence
           
        FROM tbl_order tord
        JOIN tbl_order_product top ON (top.order_id = tord.order_id AND top.vendor_id = :vendor_id)
       
        LEFT JOIN (
            SELECT order_id, vendor_id, po_number, doc_number, licence, approve_po 
            FROM oms_po_list 
            WHERE vendor_id = :vendor_id AND approve_po = 1 
            GROUP BY order_id
        ) AS po ON po.order_id = tord.order_id
        ${whereCondition}
        GROUP BY top.order_id
        ORDER BY top.order_product_id DESC
    ) AS orders ON orders.order_id = top.order_id
    JOIN tbl_product_image tpi ON (tpi.product_id = top.product_id AND tpi.default = 1 AND tpi.status = 1)
    LEFT JOIN order_product_sales_detail ops ON (ops.order_id = top.order_id AND ops.product_id = top.product_id)
    WHERE top.vendor_id = :vendor_id 
    ORDER BY top.order_product_id DESC
    `;

    const results = await sequelize.query(sql, {
        replacements: {
            vendor_id,
            // limit,
            // start
        },
        type: sequelize.QueryTypes.SELECT
    });

    return results;
}
