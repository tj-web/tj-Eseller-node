import { body, validationResult } from "express-validator";

export const validateSignup = [
  body("frmtype")
    .notEmpty()
    .withMessage("Form type is required")
    .equals("vendor_register")
    .withMessage("Invalid form type"),

  body("first_name")
    .notEmpty()
    .withMessage("First name is required")
    .isString()
    .withMessage("First name must be a string")
    .trim(),

  body("last_name")
    .notEmpty()
    .withMessage("Last name is required")
    .isString()
    .withMessage("Last name must be a string")
    .trim(),

  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .trim()
    .toLowerCase(),

  body("dial_code")
    .notEmpty()
    .withMessage("Dial code is required")
    .isIn(["+91", "+1", "+44"])
    .withMessage("Unsupported country code"),

  body("contact_number")
    .notEmpty()
    .withMessage("Contact number is required")
    .isLength({ min: 6, max: 15 })
    .withMessage("Invalid contact number"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),

  // Block personal emails
  body("email").custom((value) => {
    const blockedDomains = [
      "gmail.com",
      "yahoo.com",
      "hotmail.com",
      "outlook.com",
      "live.com",
    ];

    const domain = value.split("@")[1];

    if (blockedDomains.includes(domain)) {
      throw new Error("Please use company email");
    }

    return true;
  }),

  // Final error handler
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
