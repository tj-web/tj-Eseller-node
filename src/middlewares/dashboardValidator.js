import { query, validationResult } from "express-validator";

export const validateOemTotalLeadsQuery = [
  query("filter_start_date")
    .optional()
    .isISO8601()
    .withMessage("filter_start_date must be a valid date (YYYY-MM-DD)"),

  query("filter_end_date")
    .optional()
    .isISO8601()
    .withMessage("filter_end_date must be a valid date (YYYY-MM-DD)"),

  query("vendor_id")
    .notEmpty()
    .withMessage("vendor_id is required")
    .isNumeric()
    .withMessage("vendor_id must be a number"),

  query("show_current_plan_data")
    .optional()
    .isIn(["0", "1"])
    .withMessage("show_current_plan_data must be 0 or 1"),

  // Final middleware to handle errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    next();
  },
];
