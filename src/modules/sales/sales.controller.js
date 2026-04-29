import { planSubscribeRequestService } from "./sales.service.js";
import StatusCodes from "../../utilis/statusCodes.js";
import SystemResponse from "../../utilis/systemResponse.js";

/*********  Function for handling plan subscribe request (Boost Sales) ***********/

export const planSubscribeRequest = async (req, res) => {
  try {
    const { plan_name, budget, reminder_date, hour, minute } = req.body;
    const { profile_id, vendor_id } = req.user;

    if (!budget || !reminder_date || !hour || !minute) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(SystemResponse.badRequestError("Missing required fields."));
    }

    const result = await planSubscribeRequestService(
      { profile_id, vendor_id },
      { plan_name, budget, reminder_date, hour, minute }
    );

    return res.status(StatusCodes.SUCCESS).json(SystemResponse.success(result.message));
  } catch (error) {
    console.error("Error in planSubscribeRequest:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError(error.message || "Internal Server Error"));
  }
};
