import { planSubscribeRequestService, getOemPlansWithRawSQL } from "./sales.service.js";
import StatusCodes from "../../utilis/statusCodes.js";
import SystemResponse from "../../utilis/systemResponse.js";
import { prepareOemPlansData } from "../../helpers/oemHelper.js";

/*********  Function for handling plan subscribe request (Boost Sales) ***********/

export const planSubscribeRequest = async (req, res) => {
  try {
    const { plan_name, reminder_date, hour, minute } = req.body;
    const { profile_id, vendor_id } = req.user;

    if (!reminder_date || !hour || !minute) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(SystemResponse.badRequestError("Missing required fields."));
    }

    const result = await planSubscribeRequestService(
      { profile_id, vendor_id },
      { plan_name, reminder_date, hour, minute }
    );

    return res.status(StatusCodes.SUCCESS).json(SystemResponse.success(result.message));
  } catch (error) {
    console.error("Error in planSubscribeRequest:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError(error.message || "Internal Server Error"));
  }
};

/*********  Function for fetching oem plans info ***********/

export const fetchPlansInfo = async (req, res) => {
  try {
    const { fetch_plans_info } = req.query;
    const vendor_id = req.user.vendor_id;

    if (fetch_plans_info == 1) {
      const rawPlans = await getOemPlansWithRawSQL(vendor_id);
      const preparedPlans = prepareOemPlansData(rawPlans);
      return res.status(StatusCodes.SUCCESS).json({ plans: preparedPlans });
    }

    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(SystemResponse.badRequestError("fetch_plans_info is not set to 1"));
  } catch (error) {
    console.error("Error in fetchPlansInfo:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError(error.message || "Failed to fetch plans data"));
  }
};
