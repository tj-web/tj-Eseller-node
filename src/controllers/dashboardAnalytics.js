import { analyticsInfo } from "../utilis/analytics.js";

export const analyticsCount = async (req, res) => {
  try {
    const filter = {
      vendor_id: req.query.vendor_id,
      show_current_plan_data: req.query.show_current_plan_data || 0,
    };

    const result = await analyticsInfo(filter);
    return res.status(200).json(result);
  } catch (error) {
    console.error(" Error in analyticsCount:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
