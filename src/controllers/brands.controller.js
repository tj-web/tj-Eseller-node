import { get_vendor_brands } from "../utilis/brand.utility.js";

export const getBrands = async (req, res) => {
  try {
    const {
      vendor_id,
      orderby,
      order,
      srch_brand_name = "",
      srch_status = "",
    } = req.query;
    const result = await get_vendor_brands({
      vendor_id,
      orderby,
      order,
      srch_brand_name,
      srch_status,
    });
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in fetching vendor brands:", error);
    return res
      .status(500)
      .json({ message: "Internal Server Error in vendor orders" });
  }
};
