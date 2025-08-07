import { getAllOrders } from "../utilis/orders.utility.js";

export const getOrders = async (req, res) => {
    // console.log(req.query.vendor_id);return;
  try {
  
    const {
      // filter_start_date,
      // filter_end_date,
      vendor_id,
      // show_current_plan_data,
    } = req.query;

    const vendorId=+vendor_id
    const result = await getAllOrders({
      // filter_start_date,
      // filter_end_date,
      vendor_id,
      // show_current_plan_data,
    });
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in Get Orders:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};