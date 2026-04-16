import { insertVendorHelpQuery } from "./helpSupport.service.js";

export const addHelpSupportQuery = async (req, res, next) => {
  try {
    const { vendor_id, name, email, query } = req.body;

    const insertId = await insertVendorHelpQuery({
      vendor_id,
      name,
      email,
      query,
    });

    return res.status(200).json({
      message: "Help query submitted successfully",
      query_id: insertId,
    });

  } catch (error) {
    next(error);
  }
};