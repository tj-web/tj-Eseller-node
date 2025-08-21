import { getVendorBrands, getProductList } from "../models/ManageProduct/getManageProduct.js";

export const fetchVendorProducts = async (req, res) => {
  try {
    const vendor_id = req.user?.vendor_id || req.query.vendor_id;
    if (!vendor_id) {
      return res.status(400).json({ status: false, message: "vendor_id is required" });
    }

    const search_filter = { 
      srch_product_name: req.query.srch_product_name || "",
      srch_status: req.query.srch_status || "",
    };

    const order_by = req.query.order_by || "s_id";
    const order = req.query.order || "desc";
    const limit = req.query.limit;
    const pageNumber=req.query.pageNumber;

    
    const brand_arr = await getVendorBrands(vendor_id);

    const products = await getProductList(brand_arr, search_filter, order_by, order,limit,pageNumber);

    return res.json({
      status: true,
      message: "Products fetched successfully",
      products,
    });
  } catch (error) {
    console.error("Error fetching vendor products:", error);
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};
