import { Router } from "express";
import { createTable } from "../controllers/tableController";
import { authenticateTenant } from "../middleware/auth";

const router = Router();

/**
 * @swagger
 * /api/tables:
 *   post:
 *     summary: Create a new table
 *     description: Create a new restaurant table for QR code generation. Requires tenant authentication.
 *     tags: [Tables]
 *     security:
 *       - tenantAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTableRequest'
 *     responses:
 *       201:
 *         description: Table created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Table'
 *       400:
 *         description: Missing table name
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Missing or invalid tenant ID
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
router.post("/", authenticateTenant, createTable);

export default router;

