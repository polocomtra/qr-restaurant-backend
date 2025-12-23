import { Router } from "express";
import { getBranding, updateBranding } from "../controllers/brandingController";
import { authenticateTenant } from "../middleware/auth";

const router = Router();

/**
 * @route   GET /api/tenant/branding
 * @desc    Get current tenant's branding settings
 * @access  Private (Tenant only)
 */
router.get("/", authenticateTenant, getBranding);

/**
 * @route   PUT /api/tenant/branding
 * @desc    Update tenant's branding settings
 * @access  Private (Tenant only)
 */
router.put("/", authenticateTenant, updateBranding);

export default router;
