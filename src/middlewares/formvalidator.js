
import { body, validationResult } from "express-validator";

export const validateProduct = [
  body("product_name")
    .notEmpty()
    .withMessage("Product name is required")
    .isString()
    .withMessage("Product name must be a string")
    .trim(),

  body("brand")
    .notEmpty()
    .withMessage("Brand is required")
    .isString()
    .withMessage("Brand must be a string")
    .trim(),

  body("category")
    .notEmpty()
    .withMessage("Product category is required")
    .isString()
    .withMessage("Category must be a string")
    .trim(),

  body("website_url")
    .notEmpty()
    .withMessage("Website URL is required")
    .isURL()
    .withMessage("Website URL must be a valid URL"),

  body("overview")
    .notEmpty()
    .withMessage("Overview is required")
    .isLength({ min: 10 })
    .withMessage("Overview must be at least 10 characters long"),

  // Middleware to handle errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
