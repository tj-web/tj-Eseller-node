import { insertVendorHelpQuery } from "./helpSupport.service.js";
import StatusCodes from "../../utilis/statusCodes.js";
import SystemResponse from "../../utilis/systemResponse.js";

export const addHelpSupportQuery = async (req, res, next) => {
  try {
    const { name, email, query } = req.body;
    const vendor_id = req.user.vendor_id;

    const insertId = await insertVendorHelpQuery({
      vendor_id,
      name,
      email,
      query,
    });

    return res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success("Help query submitted successfully", { query_id: insertId }));

  } catch (error) {
    next(error);
  }
};