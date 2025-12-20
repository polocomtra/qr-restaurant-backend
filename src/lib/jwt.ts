import jwt, { SignOptions } from "jsonwebtoken";

// JWT configuration
const JWT_SECRET =
    process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

/**
 * JWT payload interface for tenant authentication
 */
export interface JwtPayload {
    tenantId: string;
    slug: string;
    iat?: number;
    exp?: number;
}

/**
 * Generate a JWT token for authenticated tenant
 * @param tenantId - Tenant's unique identifier
 * @param slug - Tenant's slug for easy identification
 * @returns Signed JWT token
 */
export function generateToken(tenantId: string, slug: string): string {
    const payload: JwtPayload = {
        tenantId,
        slug,
    };

    const options: SignOptions = {
        expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    };

    return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Verify and decode a JWT token
 * @param token - JWT token to verify
 * @returns Decoded payload if valid, null if invalid
 */
export function verifyToken(token: string): JwtPayload | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        return decoded;
    } catch (error) {
        return null;
    }
}

/**
 * Extract token from Authorization header
 * Supports both "Bearer <token>" and plain token formats
 * @param authHeader - Authorization header value
 * @returns Token string or null if not found
 */
export function extractTokenFromHeader(
    authHeader: string | undefined
): string | null {
    if (!authHeader) {
        return null;
    }

    // Support "Bearer <token>" format
    if (authHeader.startsWith("Bearer ")) {
        return authHeader.slice(7);
    }

    // Support plain token format for backward compatibility
    return authHeader;
}
