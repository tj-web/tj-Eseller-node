import { insertVendorHelpQuery } from "../models/help-Support/helpsupport.js";

export const addHelpSupportQuery = async (req, res) => {
  try {
    const { vendor_id, name, email, query } = req.body;

    if (!vendor_id || !name || !email || !query) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const insertId = await insertVendorHelpQuery({
      vendor_id,
      name,
      email,
      query
    });

    if (insertId > 0) {
      return res.status(200).json({
        success: true,
        message: "Help query submitted successfully",
        query_id: insertId
      });
    } else {
      return res.status(500).json({ success: false, message: "Failed to submit query" });
    }
  } catch (error) {
    console.error("Controller Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
