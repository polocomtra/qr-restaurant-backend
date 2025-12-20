import { Socket } from "socket.io";
import { verifyToken } from "../lib/jwt";
import { prisma } from "../lib/prisma";

/**
 * Socket.io authentication middleware
 * Verifies JWT token and attaches tenant info to socket
 */
export async function socketAuthMiddleware(
    socket: Socket,
    next: (err?: Error) => void
) {
    try {
        const token = socket.handshake.auth.token;

        // Allow guest connections (for order tracking)
        // Guests can only listen to specific order updates, not join tenant rooms
        if (!token) {
            socket.data.isGuest = true;
            socket.data.authenticated = false;
            return next();
        }

        // Verify JWT token
        const payload = verifyToken(token);

        if (!payload) {
            return next(new Error("Invalid or expired token"));
        }

        // Verify tenant exists
        const tenant = await prisma.tenant.findUnique({
            where: { id: payload.tenantId },
        });

        if (!tenant) {
            return next(new Error("Tenant not found"));
        }

        // Attach tenant info to socket
        socket.data.tenantId = tenant.id;
        socket.data.tenantSlug = tenant.slug;
        socket.data.authenticated = true;
        socket.data.isGuest = false;

        next();
    } catch (error) {
        console.error("Socket auth error:", error);
        next(new Error("Authentication failed"));
    }
}

/**
 * Validate if a tenantId exists in database
 * Used for guest connections to verify they're joining a valid tenant room
 */
export async function validateTenantId(tenantId: string): Promise<boolean> {
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
    });
    return !!tenant;
}
