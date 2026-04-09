import { body, validationResult } from "express-validator";

export const validateLogin = [
  body("frmtype")
    .notEmpty()
    .withMessage("Form type is required")
    .equals("vendor_login")
    .withMessage("Invalid form type"),
    
  body("username")
    .notEmpty()
    .withMessage("Username is required")
    .isEmail()
    .withMessage("Username must be a valid email")
    .trim()
    .toLowerCase(),

  body("userpassword")
    .notEmpty()
    .withMessage("Password is required"),

  body("rememberme")
    .notEmpty()
    .withMessage("Remember me is required")
    .isIn(["0", "1", 0, 1])
    .withMessage("Remember me must be 0 or 1"),

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