import { body, validationResult } from "express-validator";

export const validateHelpSupportQuery = [
   
    body("vendor_id")
        .optional()
        .isInt({ gt: 0 })
        .withMessage("vendor_id must be a positive integer"),

    body("name")
        .notEmpty()
        .withMessage("Name is required")
        .isLength({ min: 2, max: 100 })
        .withMessage("Name must be between 2 and 100 characters")
        .trim(),

    body("email")
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Invalid email format")
        .normalizeEmail(),

    body("query")
        .notEmpty()
        .withMessage("Query is required")
        .isLength({ min: 5 })
        .withMessage("Query must be at least 5 characters")
        .trim(),

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