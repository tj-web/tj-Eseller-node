import { body, validationResult } from "express-validator";

export const validateChangePassword = [
  // 🔸 Form type
  body("frmtype")
    .notEmpty()
    .withMessage("Form type is required")
    .equals("change_password")
    .withMessage("Invalid form type"),

  // 🔸 Old password
  body("old_password")
    .notEmpty()
    .withMessage("Old password is required"),

  // 🔸 New password
  body("new_password")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8, max: 50 })
    .withMessage("Password must be between 8 and 50 characters"),
    
  // 🔸 Confirm password
  body("confirm_password")
    .notEmpty()
    .withMessage("Confirm password is required")
    .custom((value, { req }) => {
      if (value !== req.body.new_password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),

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