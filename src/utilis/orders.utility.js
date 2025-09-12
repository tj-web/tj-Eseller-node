import { or, Sequelize } from "sequelize";
import sequelize from "../config/connection.js";
import { unserialize } from "php-serialize";
import { getAllOrders } from "../models/orders.model.js";
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
