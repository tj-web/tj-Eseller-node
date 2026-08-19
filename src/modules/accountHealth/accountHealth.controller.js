import {
  handleGetHealthScore,
  getReviewsData,
  handleGetProfileCompletion,
  handleGetTrustedSeller,
  handleGetAccountStatus,
  handleSaveReviewReply,
  handleSendReviewEmail,
} from "./accountHealth.service.js";
import StatusCodes from "../../utilis/statusCodes.js";
import SystemResponse from "../../utilis/systemResponse.js";

export const getHealthScore = async (req, res) => {
  try {
    const vendorId = req.user.vendor_id;
    const result = await handleGetHealthScore(vendorId);

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
    const result = await getReviewsData(vendorId, req.query);

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
    const result = await handleGetProfileCompletion(vendorId);

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
    const result = await handleGetTrustedSeller(vendorId);

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
    const result = await handleGetAccountStatus(vendorId);

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
    const result = await handleSaveReviewReply(vendorId, profileId, req.body);

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
    const result = await handleSendReviewEmail(vendorId, req.body);

    return res
      .status(StatusCodes.SUCCESS)
      .json(SystemResponse.success(result.message, result));
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError(error.message));
  }
};
