import {
  getHealthScoreService,
  getReviewsDataService,
  getProfileCompletionService,
  getTrustedSellerService,
  getAccountStatusService,
  saveReviewReplyService,
  sendReviewEmailService,
} from "./accountHealth.service.js";
import StatusCodes from "../../utilis/statusCodes.js";
import SystemResponse from "../../utilis/systemResponse.js";

export const getHealthScore = async (req, res) => {
  try {
    const vendorId = req.user.vendor_id;
    const result = await getHealthScoreService(vendorId);

    return res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success("Account health score fetched successfully", result));
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError(error.message));
  }
};

export const getReviews = async (req, res) => {
  try {
    const vendorId = req.user.vendor_id;
    const result = await getReviewsDataService(vendorId, req.query);

    return res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success("Reviews fetched successfully", result));
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError(error.message));
  }
};

export const getProfileCompletion = async (req, res) => {
  try {
    const vendorId = req.user.vendor_id;
    const result = await getProfileCompletionService(vendorId);

    return res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success("Profile completion data fetched successfully", result));
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError(error.message));
  }
};

export const getTrustedSeller = async (req, res) => {
  try {
    const vendorId = req.user.vendor_id;
    const result = await getTrustedSellerService(vendorId);

    return res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success("Trusted seller data fetched successfully", result));
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError(error.message));
  }
};

export const getAccountStatus = async (req, res) => {
  try {
    const vendorId = req.user.vendor_id;
    const result = await getAccountStatusService(vendorId);

    return res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success("Account status fetched successfully", result));
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError(error.message));
  }
};

export const saveReviewReply = async (req, res) => {
  try {
    const vendorId = req.user.vendor_id;
    const profileId = req.user.profile_id;
    const result = await saveReviewReplyService(vendorId, profileId, req.body);

    return res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success(result.message, result));
  } catch (error) {
    const statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    return res
      .status(statusCode)
      .json(SystemResponse.getErrorResponse(error.message, error, statusCode));
  }
};

export const sendReviewEmail = async (req, res) => {
  try {
    const vendorId = req.user.vendor_id;
    const result = await sendReviewEmailService(vendorId, req.body);

    return res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success(result.message, result));
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError(error.message));
  }
};
