import { body, validationResult } from "express-validator";
import validator from "validator";

export const validateVerifyOtp = [

  body("frmtype")
    .notEmpty()
    .withMessage("Form type is required")
    .equals("verify_otp")
    .withMessage("Invalid form type"),

  body("phone_number")
    .notEmpty()
    .withMessage("Phone number is required")
    .custom((value) => {
      if (!validator.isMobilePhone(value, "any")) {
        throw new Error("Invalid phone number");
      }
      return true;
    })
    .trim(),

  body("otp")
    .notEmpty()
    .withMessage("OTP is required")
    .isLength({ min: 4, max: 6 })
    .withMessage("OTP must be 4 to 6 digits")
    .isNumeric()
    .withMessage("OTP must be numeric"),

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