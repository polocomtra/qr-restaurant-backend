import { Router } from "express";
import {
    getTables,
    createTable,
    getTableById,
    markTableAsPaid,
    setSocketIO,
} from "../controllers/tableController";
import { authenticateTenant } from "../middleware/auth";

const router = Router();

/**
 * @swagger
 * /api/tables:
 *   get:
 *     summary: Get all tables for the authenticated tenant
 *     description: Retrieve all tables for the authenticated tenant. Requires tenant authentication.
 *     tags: [Tables]
 *     security:
 *       - tenantAuth: []
 *     responses:
 *       200:
 *         description: List of tables
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Table'
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
/**
 * @swagger
 * /api/tables/{id}:
 *   get:
 *     summary: Get table by ID
 *     description: Retrieve table information by ID. Public endpoint for guests.
 *     tags: [Tables]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Table ID
 *     responses:
 *       200:
 *         description: Table information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Table'
 *       404:
 *         description: Table not found
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
/**
 * @swagger
 * /api/tables/{id}/pay:
 *   post:
 *     summary: Mark table as paid and reset for next customer
 *     description: Mark a table as paid. This will emit a socket event to clear user's localStorage. Requires tenant authentication.
 *     tags: [Tables]
 *     security:
 *       - tenantAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Table ID
 *     responses:
 *       200:
 *         description: Table marked as paid successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 tableId:
 *                   type: string
 *       404:
 *         description: Table not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/:id/pay", authenticateTenant, markTableAsPaid);
router.get("/:id", getTableById);
router.get("/", authenticateTenant, getTables);
router.post("/", authenticateTenant, createTable);

// Export setSocketIO function to be called from index.ts
export { setSocketIO };

export default router;
