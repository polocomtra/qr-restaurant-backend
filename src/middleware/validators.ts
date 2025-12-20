import { body, param, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

/**
 * Middleware to handle validation errors
 * Returns 400 with validation errors if any exist
 */
export const handleValidationErrors = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: "Validation failed",
            details: errors.array().map((err) => ({
                field: err.type === "field" ? err.path : undefined,
                message: err.msg,
            })),
        });
    }
    next();
};

// ==================== Auth Validators ====================

export const validateLogin = [
    body("slug")
        .trim()
        .notEmpty()
        .withMessage("Slug is required")
        .isLength({ min: 2, max: 50 })
        .withMessage("Slug must be between 2 and 50 characters")
        .matches(/^[a-z0-9-]+$/)
        .withMessage(
            "Slug can only contain lowercase letters, numbers, and hyphens"
        ),
    body("password")
        .notEmpty()
        .withMessage("Password is required")
        .isLength({ min: 1, max: 100 })
        .withMessage("Password must be between 1 and 100 characters"),
    handleValidationErrors,
];

// ==================== Order Validators ====================

export const validateCreateOrder = [
    body("tenantId")
        .notEmpty()
        .withMessage("Tenant ID is required")
        .isUUID()
        .withMessage("Invalid tenant ID format"),
    body("tableName")
        .trim()
        .notEmpty()
        .withMessage("Table name is required")
        .isLength({ max: 100 })
        .withMessage("Table name must be less than 100 characters"),
    body("items")
        .isArray({ min: 1 })
        .withMessage("At least one item is required"),
    body("items.*.productId")
        .notEmpty()
        .withMessage("Product ID is required")
        .isUUID()
        .withMessage("Invalid product ID format"),
    body("items.*.quantity")
        .isInt({ min: 1, max: 100 })
        .withMessage("Quantity must be between 1 and 100"),
    body("items.*.note")
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage("Note must be less than 500 characters"),
    body("total")
        .isInt({ min: 0 })
        .withMessage("Total must be a positive number"),
    handleValidationErrors,
];

export const validateAddItemsToOrder = [
    param("id").isUUID().withMessage("Invalid order ID format"),
    body("items")
        .isArray({ min: 1 })
        .withMessage("At least one item is required"),
    body("items.*.productId")
        .notEmpty()
        .withMessage("Product ID is required")
        .isUUID()
        .withMessage("Invalid product ID format"),
    body("items.*.quantity")
        .isInt({ min: 1, max: 100 })
        .withMessage("Quantity must be between 1 and 100"),
    body("items.*.note")
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage("Note must be less than 500 characters"),
    body("additionalTotal")
        .isInt({ min: 0 })
        .withMessage("Additional total must be a positive number"),
    handleValidationErrors,
];

export const validateUpdateOrderStatus = [
    param("id").isUUID().withMessage("Invalid order ID format"),
    body("status")
        .notEmpty()
        .withMessage("Status is required")
        .isIn(["PENDING", "CONFIRMED", "DONE", "CANCELLED"])
        .withMessage(
            "Status must be one of: PENDING, CONFIRMED, DONE, CANCELLED"
        ),
    handleValidationErrors,
];

export const validateOrderId = [
    param("id").isUUID().withMessage("Invalid order ID format"),
    handleValidationErrors,
];

// ==================== Product Validators ====================

export const validateCreateProduct = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Product name is required")
        .isLength({ min: 1, max: 200 })
        .withMessage("Product name must be between 1 and 200 characters"),
    body("price")
        .isInt({ min: 0 })
        .withMessage("Price must be a positive number"),
    body("categoryId")
        .notEmpty()
        .withMessage("Category ID is required")
        .isUUID()
        .withMessage("Invalid category ID format"),
    body("imageUrl")
        .optional()
        .trim()
        .isURL()
        .withMessage("Invalid image URL format"),
    body("isAvailable")
        .optional()
        .isBoolean()
        .withMessage("isAvailable must be a boolean"),
    handleValidationErrors,
];

export const validateUpdateProduct = [
    param("id").isUUID().withMessage("Invalid product ID format"),
    body("name")
        .optional()
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage("Product name must be between 1 and 200 characters"),
    body("price")
        .optional()
        .isInt({ min: 0 })
        .withMessage("Price must be a positive number"),
    body("categoryId")
        .optional()
        .isUUID()
        .withMessage("Invalid category ID format"),
    body("imageUrl")
        .optional()
        .trim()
        .custom((value) => {
            // Allow empty string or null to clear image
            if (value === "" || value === null) return true;
            // Validate URL format if provided
            try {
                new URL(value);
                return true;
            } catch {
                throw new Error("Invalid image URL format");
            }
        }),
    body("isAvailable")
        .optional()
        .isBoolean()
        .withMessage("isAvailable must be a boolean"),
    handleValidationErrors,
];

export const validateProductId = [
    param("id").isUUID().withMessage("Invalid product ID format"),
    handleValidationErrors,
];

// ==================== Category Validators ====================

export const validateCreateCategory = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Category name is required")
        .isLength({ min: 1, max: 100 })
        .withMessage("Category name must be between 1 and 100 characters"),
    handleValidationErrors,
];

export const validateUpdateCategory = [
    param("id").isUUID().withMessage("Invalid category ID format"),
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Category name is required")
        .isLength({ min: 1, max: 100 })
        .withMessage("Category name must be between 1 and 100 characters"),
    handleValidationErrors,
];

export const validateCategoryId = [
    param("id").isUUID().withMessage("Invalid category ID format"),
    handleValidationErrors,
];

// ==================== Table Validators ====================

export const validateCreateTable = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Table name is required")
        .isLength({ min: 1, max: 100 })
        .withMessage("Table name must be between 1 and 100 characters"),
    handleValidationErrors,
];

export const validateTableId = [
    param("id").isUUID().withMessage("Invalid table ID format"),
    handleValidationErrors,
];

// ==================== Store Validators ====================

export const validateStoreSlug = [
    param("slug")
        .trim()
        .notEmpty()
        .withMessage("Store slug is required")
        .isLength({ min: 2, max: 50 })
        .withMessage("Slug must be between 2 and 50 characters")
        .matches(/^[a-z0-9-]+$/)
        .withMessage(
            "Slug can only contain lowercase letters, numbers, and hyphens"
        ),
    handleValidationErrors,
];
