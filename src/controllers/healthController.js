import {getTotalReviewsCount} from '../models/accountHealth.js'
import {getVendorProductIds,getReviewsData,getAnalyticsData} from "../models/accountHealth.js";

export const getAccountHealth =  async (req, res) => {
 try {
  const vendorId = req.query.vendorId;
  if (!vendorId) {
    return res.status(400).json({ error: "vendorId query parameter is required" });
  }

  const filter = {
      vendor_id: vendorId,
      filter_start_date: req.body?.start_date || "",
      filter_end_date: req.body?.end_date || "",
      show_current_plan_data: req.body?.show_current_plan_data || 0,
    };

    
  const result = await getAnalyticsData(filter);
  const productIds = await getVendorProductIds(vendorId);
  const data = await getReviewsData(productIds.productIds);

  return res.json({
    status: true,
    message: "Product info fetched successfully",
    data: productIds,
    reviewsData: data,
    result: result,
  })
  
 } catch (error) {
  res.status(500).json({ error: "Internal server error" });
  console.error("Error in getAccountHealth:", error);
 }
}

//--------------------this will help to us to get the reviews data--------------------
export const getReviews = async (req, res) => {
 try {
    const { productIds, productName, rating, date } = req.query;

    const filters = {};
    if (productName) filters.productName = productName;
    if (rating) filters.rating = rating;
    if (date) filters.date = date;

    const count = await getTotalReviewsCount(productIds || [], filters);

    return res.json({ success: true, totalReviews: count });
  } catch (error) {
    console.error("Error fetching review count:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}


