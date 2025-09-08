import { vendorOrders } from "../utilis/orders.utility.js";

export const getOrders = async (req, res) => {
  try {
    const { vendor_id } = req.query;

    const vendorId = +vendor_id;
    const result = await vendorOrders({
      vendor_id,
    });
    return res
      .status(200)
      .json({
        status: true,
        message: "Data fetched successfully",
        data: result,
      });
  } catch (error) {
    console.error("Error in Get Orders:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
