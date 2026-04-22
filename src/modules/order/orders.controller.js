import { vendorOrders } from "../../utilis/orders.utility.js";

export const getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const vendor_id = req.user.vendor_id;
    const result = await vendorOrders({
      vendor_id,
      params: { page, limit },
    });

    return res.status(200).json({
      status: true,
      message: "Data fetched successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error in Get Orders:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
