import { body, validationResult } from "express-validator";

export const validateForgotPassword = [
  body("frmtype")
    .notEmpty()
    .withMessage("Form type is required")
    .equals("forget_password")
    .withMessage("Invalid form type"),

  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .isLength({ min: 5, max: 255 })
    .withMessage("Email must be between 5 and 255 characters")
    .trim()
    .toLowerCase(),

  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        errors: errors.array(),
      });
    }

    next();
  },
];