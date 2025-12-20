import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { verifyToken, extractTokenFromHeader } from "../lib/jwt";

/**
 * JWT-based authentication middleware for tenant routes
 * Verifies JWT token from Authorization header and attaches tenant to request
 */
export async function authenticateTenant(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        const token = extractTokenFromHeader(authHeader);

        if (!token) {
            return res.status(401).json({ error: "Authentication required" });
        }

        // Verify JWT token
        const payload = verifyToken(token);

        if (!payload) {
            return res.status(401).json({ error: "Invalid or expired token" });
        }

        // Fetch tenant from database
        const tenant = await prisma.tenant.findUnique({
            where: { id: payload.tenantId },
        });

        if (!tenant) {
            return res.status(401).json({ error: "Tenant not found" });
        }

        // Attach tenant to request for use in controllers
        req.tenant = tenant;
        next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        res.status(500).json({ error: "Authentication failed" });
    }
}
