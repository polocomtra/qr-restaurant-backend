import { Router } from "express";
import { getStoreBySlug } from "../controllers/storeController";
import { validateStoreSlug } from "../middleware/validators";

const router = Router();

/**
 * @swagger
 * /api/store/{slug}:
 *   get:
 *     summary: Get restaurant menu by slug
 *     description: Retrieve restaurant details with nested categories and available products
 *     tags: [Store]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Restaurant slug identifier
 *         example: pho-test
 *     responses:
 *       200:
 *         description: Restaurant menu data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StoreResponse'
 *       404:
 *         description: Restaurant not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:slug", validateStoreSlug, getStoreBySlug);

export default router;
