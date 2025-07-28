import { oemTotalLeadsCountInfo } from "../utilis/dashboard.js";
//sniih eovehiv eaybevbe
export const totalLeadsCountInfo = async (req, res) => {
  try {
    const {
      filter_start_date,
      filter_end_date,
      vendor_id,
      show_current_plan_data,
    } = req.query;

    
    const result = await oemTotalLeadsCountInfo({
      filter_start_date,
      filter_end_date,
      vendor_id,
      show_current_plan_data,
    });
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in oemTotalLeadsCountInfo:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
