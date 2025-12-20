import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { verifyPassword } from "../lib/password";
import { generateToken } from "../lib/jwt";

/**
 * Login endpoint for merchants
 * Validates credentials using bcrypt and returns JWT token
 */
export async function login(req: Request, res: Response) {
    try {
        const { slug, password } = req.body;

        if (!slug || !password) {
            return res
                .status(400)
                .json({ error: "Slug and password are required" });
        }

        // Find tenant by slug
        const tenant = await prisma.tenant.findUnique({
            where: { slug },
        });

        if (!tenant) {
            // Use same error message to prevent user enumeration
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Verify password using bcrypt
        const isValidPassword = await verifyPassword(password, tenant.password);

        if (!isValidPassword) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Generate JWT token
        const token = generateToken(tenant.id, tenant.slug);

        res.json({
            tenantId: tenant.id,
            token,
            expiresIn: process.env.JWT_EXPIRES_IN || "24h",
        });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ error: "Login failed" });
    }
}
