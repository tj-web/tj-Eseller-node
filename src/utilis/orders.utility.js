import { or, Sequelize } from "sequelize";
import sequelize from "../db/connection.js";
import { unserialize } from "php-serialize";

// export async function vendorOrders({ vendor_id, params = {} }) {
//   const limit = params.limit || 10;
//   const page = params.page || 1;
//   const order_status = params.status || "";
//   let data = [];
//   const orders = await getAllOrders({ vendor_id, order_status, limit, page });
//   console.log(orders);
//   if (!orders) {
//     orders.foreach((order) => {
//       order["tax_rate"] = 0;
//       const prod_img = order["image"]
//         ? CONSTANTS?.AWS_FETCH_PRODUCT_IMAGES.order["image"]
//         : DIR_FS_PRODUCT_NOIMAGE;
//       /* Order Product Plans List */
//       const orderSummary = {
//         product_name: order["product_name"],
//         product_image: prod_img,
//         plan_details: "",
//         plan_variables: "",
//         plan_other_variables: "",
//         gst_type: order["gst_type"],
//         sub_total: order["sub_total"],
//         gst: (order["sub_total"] * order["tax_rate"]) / 100,
//         product_total:
//           order["sub_total"] + (order["sub_total"] * order["tax_rate"]) / 100,
//       };
//       /* Order Tracking */
//       const poDoc = order["doc_number"]
//         ? process.env.AWS_PATH + "oms/omspo/" + order["doc_number"] + ".pdf"
//         : "";
//       const poLicence = order["licence"]
//         ? process.env.AWS_PATH + "oms/licence/" + order["licence"]
//         : "";
//       const removeLicence = order["order_delivered"] == 1 ? 0 : 1;
//       if (order["order_cancelled"] == 1) {
//         const orderTracking = [
//           {
//             field: "order_placed",
//             name: "Order Placed",
//             value: order["order_placed"],
//           },
//           {
//             field: "order_cancelled",
//             name: "Order Cancelled",
//             value: order["order_cancelled"],
//           },
//         ];
//       } else {
//         const orderTracking = [
//           {
//             field: "po_generated",
//             name: "PO Generated",
//             value: order["po_generated"],
//             po_number: order["po_number"],
//             po_document: poDoc,
//             licence: order["licence"],
//             licence_path: poLicence,
//             removeLicence: removeLicence,
//           },
//           {
//             field: "order_delivered",
//             name: "Order Delivered",
//             value: order["order_delivered"],
//           },
//           {
//             field: "order_placed",
//             name: "Order Placed",
//             value: order["order_placed"],
//           },
//         ];
//       }
//       /** Current Order Status */
//       currentStatus = "";
//       if (order["order_delivered"] == 1) {
//         currentStatus = "Order Delivered";
//       } else if (order["po_generated"] == 1) {
//         currentStatus = "Po Generated";
//       } else if (order["order_cancelled"] == 1) {
//         currentStatus = "Order Cancelled";
//       } else {
//         currentStatus = "Order Placed";
//       }

//       /* Main Order Product List */
//       orderProducts[order["order_id"]]["order_id"] = order["order_id"];
//       orderProducts[order["order_id"]]["product_name"] = order["product_name"];
//       orderProducts[order["order_id"]]["product_image"] = prod_img;
//       orderProducts[order["order_id"]]["order_date"] = date(
//         "d-m-Y (h:i A)",
//         strtotime(order["order_date"])
//       );
//       orderProducts[order["order_id"]]["current_status"] = currentStatus;
//       orderProducts[order["order_id"]]["gst_type"] = order["gst_type"];
//       orderProducts[order["order_id"]]["delivery_type"] =
//         order[
//           "delivery_type"
//         ]; /** 1= Electronic, 2=Physical, 3=Software (OMS)*/

//       orderSubTotal = isset(orderProducts[order["order_id"]]["order_sub_total"])
//         ? orderProducts[order["order_id"]]["order_sub_total"]
//         : 0;
//       orderProducts[order["order_id"]]["order_sub_total"] =
//         orderSubTotal + orderSummary["sub_total"];

//       orderGst = isset(orderProducts[$order["order_id"]]["order_gst"])
//         ? orderProducts[order["order_id"]]["order_gst"]
//         : 0;
//       orderProducts[order["order_id"]]["order_gst"] =
//         orderGst + orderSummary["gst"];

//       orderTotal = isset(orderProducts[$order["order_id"]]["order_total"])
//         ? orderProducts[order["order_id"]]["order_total"]
//         : 0;
//       orderProducts[order["order_id"]]["order_total"] =
//         orderTotal + orderSummary["product_total"];

//       orderProducts[order["order_id"]]["order_detail"] = orderSummary;
//       orderProducts[order["order_id"]]["order_tracking"] = orderTracking;
//     });

//     data["orders"] = orderProducts;
//     return data;
//   }
// }

async function getAllOrders({
  vendor_id,
  order_status = "",
  limit = 10,
  start = 0,
}) {
  let whereCondition = "";

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
    type: sequelize.QueryTypes.SELECT,
  });

  return results;
}
export async function vendorOrders({ vendor_id, params = {} }) {
  const limit = params.limit || 10;
  const page = params.page || 1;
  const order_status = params.status || "";
  let orderProducts = {};

  const orders = await getAllOrders({ vendor_id, order_status, limit, page });

  if (orders && orders.length > 0) {
    orders.forEach((order) => {
      order.tax_rate = 0;

      const prod_img = order.image
        ? CONSTANTS?.AWS_FETCH_PRODUCT_IMAGES + order.image
        : DIR_FS_PRODUCT_NOIMAGE;

      const orderSummary = {
        product_name: order.product_name,
        product_image: prod_img,
        plan_details: "",
        plan_variables: order["plan_variables"]
          ? unserialize(order["plan_variables"])
          : [],
        plan_other_variables: order["plan_other_variables"]
          ? unserialize(order["plan_other_variables"])
          : [],

        gst_type: order.gst_type,
        sub_total: order.sub_total,
        gst: (order.sub_total * order.tax_rate) / 100,
        product_total:
          order.sub_total + (order.sub_total * order.tax_rate) / 100,
      };

      const poDoc = order.doc_number
        ? process.env.AWS_PATH + "oms/omspo/" + order.doc_number + ".pdf"
        : "";
      const poLicence = order.licence
        ? process.env.AWS_PATH + "oms/licence/" + order.licence
        : "";
      const removeLicence = order.order_delivered == 1 ? 0 : 1;

      let orderTracking;
      if (order.order_cancelled == 1) {
        orderTracking = [
          {
            field: "order_placed",
            name: "Order Placed",
            value: order.order_placed,
          },
          {
            field: "order_cancelled",
            name: "Order Cancelled",
            value: order.order_cancelled,
          },
        ];
      } else {
        orderTracking = [
          {
            field: "po_generated",
            name: "PO Generated",
            value: order.po_generated,
            po_number: order.po_number,
            po_document: poDoc,
            licence: order.licence,
            licence_path: poLicence,
            removeLicence,
          },
          {
            field: "order_delivered",
            name: "Order Delivered",
            value: order.order_delivered,
          },
          {
            field: "order_placed",
            name: "Order Placed",
            value: order.order_placed,
          },
        ];
      }

      let currentStatus = "";
      if (order.order_delivered == 1) currentStatus = "Order Delivered";
      else if (order.po_generated == 1) currentStatus = "Po Generated";
      else if (order.order_cancelled == 1) currentStatus = "Order Cancelled";
      else currentStatus = "Order Placed";

      if (!orderProducts[order.order_id]) {
        orderProducts[order.order_id] = {
          order_id: order.order_id,
          product_name: order.product_name,
          product_image: prod_img,
          order_date: new Date(order.order_date).toLocaleString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
          current_status: currentStatus,
          gst_type: order.gst_type,
          delivery_type: order.delivery_type,
          order_sub_total: 0,
          order_gst: 0,
          order_total: 0,
          order_detail: [],
          order_tracking: [],
        };
      }

      orderProducts[order.order_id].order_sub_total += orderSummary.sub_total;
      orderProducts[order.order_id].order_gst += orderSummary.gst;
      orderProducts[order.order_id].order_total += orderSummary.product_total;
      orderProducts[order.order_id].order_detail.push(orderSummary);
      orderProducts[order.order_id].order_tracking = orderTracking;
    });
  }

  return { orders: orderProducts };
}
