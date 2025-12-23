import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

/**
 * Get current tenant's branding settings
 * GET /api/tenant/branding
 */
export const getBranding = async (req: Request, res: Response) => {
    try {
        const tenant = req.tenant;

        if (!tenant) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const tenantData = await prisma.tenant.findUnique({
            where: { id: tenant.id },
            select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
                primaryColor: true,
                secondaryColor: true,
            },
        });

        if (!tenantData) {
            return res.status(404).json({
                success: false,
                message: "Tenant not found",
            });
        }

        return res.json({
            success: true,
            branding: {
                logoUrl: tenantData.logoUrl,
                primaryColor: tenantData.primaryColor || "#9333ea", // Default purple
                secondaryColor: tenantData.secondaryColor || "#f97316", // Default orange
            },
        });
    } catch (error) {
        console.error("Error fetching branding:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

/**
 * Update tenant's branding settings
 * PUT /api/tenant/branding
 */
export const updateBranding = async (req: Request, res: Response) => {
    try {
        const tenant = req.tenant;

        if (!tenant) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const { logoUrl, primaryColor, secondaryColor } = req.body;

        // Validate color format (hex color)
        const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

        if (primaryColor && !hexColorRegex.test(primaryColor)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid primary color format. Use hex format (e.g., #9333ea)",
            });
        }

        if (secondaryColor && !hexColorRegex.test(secondaryColor)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid secondary color format. Use hex format (e.g., #f97316)",
            });
        }

        // Update tenant branding
        const updatedTenant = await prisma.tenant.update({
            where: { id: tenant.id },
            data: {
                logoUrl: logoUrl !== undefined ? logoUrl : undefined,
                primaryColor: primaryColor || undefined,
                secondaryColor: secondaryColor || undefined,
            },
            select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
                primaryColor: true,
                secondaryColor: true,
            },
        });

        return res.json({
            success: true,
            message: "Branding updated successfully",
            branding: {
                logoUrl: updatedTenant.logoUrl,
                primaryColor: updatedTenant.primaryColor || "#9333ea",
                secondaryColor: updatedTenant.secondaryColor || "#f97316",
            },
        });
    } catch (error) {
        console.error("Error updating branding:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
