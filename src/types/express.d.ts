import { Tenant } from "@prisma/client";

/**
 * Extend Express Request interface to include tenant information
 * This provides type safety when accessing req.tenant in controllers
 */
declare global {
    namespace Express {
        interface Request {
            tenant?: Tenant;
        }
    }
}

export {};
