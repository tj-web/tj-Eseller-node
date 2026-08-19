import StatusCodes from "../../utilis/statusCodes.js";
import SystemResponse from "../../utilis/systemResponse.js";
import { query, validationResult, body } from "express-validator";
import * as productService from "./product.service.js";

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(SystemResponse.badRequestError(errors.array()[0].msg));
  }
  return next();
};

export const validateVendorOwnership = async (req, res, next) => {
  try {
    const vendor_id = req.user?.vendor_id;
    if (!vendor_id) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json(SystemResponse.unauthorizedError("Unauthorized: vendor_id missing"));
    }
    
    // Product ID can be in params, query, or body
    const product_id = req.params.product_id || req.query.product_id || req.body.product_id;
    if (!product_id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(SystemResponse.badRequestError("product_id is required for ownership check"));
    }

    const brandArr = await productService.getVendorBrands(vendor_id);
    const isVendor = await productService.isVendorProduct(product_id, brandArr);

    if (!isVendor) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json(SystemResponse.forbiddenError("Unauthorized: Product does not belong to vendor"));
    }

    return next();
  } catch (error) {
    console.error("Error in validateVendorOwnership middleware:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(SystemResponse.internalServerError("Error validating vendor ownership"));
  }
};


export const validateFetchVendorProducts = [
  query("srch_product_name").optional().isString().trim().escape(),
  query("srch_status").optional().isInt().toInt(),
  query("order_by").optional().isIn(["s_id", "s_product_name", "s_status"]),
  query("order").optional().isIn(["asc", "desc"]),
  query("limit").optional().isInt({ min: 1 }).toInt(),
  query("pageNumber").optional().isInt({ min: 1 }).toInt(),
  validateRequest
];

export const validateBasicDetails = [
  body("product_name").optional().isString().trim().escape(),
  body("brand_id").optional().toInt(),
  body("website_url").optional().isString().trim(),
  body("trial_available").optional().toInt(),
  body("free_downld_available").optional().isString().trim(),
  body("product_code").optional().isString().trim().escape(),
  body("price").optional().toFloat(),
  body("special_price").optional().toFloat(),
  body("duration").optional().toInt(),
  body("discount").optional().toFloat(),
  body("price_text").optional().isString().trim(),
  body("slug").optional().isString().trim().escape(),
  body("search_keyword").optional().isString().trim(),
  body("page_title").optional().isString().trim(),
  body("meta_title").optional().isString().trim(),
  body("page_keyword").optional().isString().trim(),
  body("page_description").optional().isString().trim(),
  body("cano_url").optional().isString().trim(),
  body("featured_start_date").optional().isString().trim(),
  body("featured_end_date").optional().isString().trim(),
  body("trial_duration").optional().isString().trim(),
  body("trial_duration_in").optional().isString().trim(),
  body("free_downld_path").optional(),
  body("show_in_peripherals").optional().isString().trim(),
  body("price_type").optional().isString().trim(),
  body("commission_type").optional().isString().trim(),
  body("commission").optional().toFloat(),
  body("tp_comment").optional().isString().trim(),
  body("discount_factor").optional().isString().trim(),
  body("discount_value").optional().isString().trim(),
  body("rebate").optional().isString().trim(),
  body("renewable_term").optional().isString().trim(),
  body("custom_search_order").optional().isString().trim(),
  body("recommended").optional().isString().trim(),
  body("manual_reviews").optional().isString().trim(),
  validateRequest
];

export const validateProductIdQuery = [
  query("product_id").notEmpty().withMessage("product_id is required").isInt().toInt(),
  validateRequest
];

export const validateProductSpecificationBody = [
  body("product_id").notEmpty().withMessage("product_id is required").isInt().toInt(),
  body("deployment").notEmpty().withMessage("deployment is required"),
  body("device").notEmpty().withMessage("device is required"),
  body("operating_system").notEmpty().withMessage("operating_system is required"),
  body("organization_type").notEmpty().withMessage("organization_type is required"),
  body("languages").optional(),
  validateRequest
];

export const validateSaveFeatureBody = [
  body("product_id").notEmpty().withMessage("product_id is required").isInt().toInt(),
  body("section_id").notEmpty().withMessage("section_id is required").isInt().toInt(),
  validateRequest
];

export const validateAddScreenshotsBody = [
  body("product_id").notEmpty().withMessage("product_id is required").isInt().toInt(),
  validateRequest
];

export const validateAddGalleryBody = [
  body("product_id").notEmpty().withMessage("product_id is required").isInt().toInt(),
  validateRequest
];

export const validateAddVideoBody = [
  body("product_id").notEmpty().withMessage("product_id is required").isInt().toInt(),
  validateRequest
];

export const validateAddEnrichmentBody = [
  body("product_id").notEmpty().withMessage("product_id is required").isInt().toInt(),
  validateRequest
];
