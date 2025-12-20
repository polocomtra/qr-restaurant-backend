import rateLimit from "express-rate-limit";

/**
 * General API rate limiter
 * Limits each IP to 100 requests per 15 minutes
 */
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: "Too many requests, please try again later.",
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Stricter rate limiter for authentication endpoints
 * Prevents brute force attacks on login
 * Limits each IP to 5 login attempts per 15 minutes
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: {
        error: "Too many login attempts, please try again after 15 minutes.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Rate limiter for order creation
 * Prevents spam orders
 * Limits each IP to 10 orders per 15 minutes
 */
export const orderLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 orders per windowMs
    message: {
        error: "Too many orders created, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});
