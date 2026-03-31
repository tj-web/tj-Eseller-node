import { body, validationResult } from "express-validator";
import validator from "validator";

export const validateSendOtp = [
  // 🔸 Form type
  body("frmtype")
    .notEmpty()
    .withMessage("Form type is required")
    .equals("send_otp")
    .withMessage("Invalid form type"),

  // 🔸 Phone number
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

  // 🔥 Final error handler
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