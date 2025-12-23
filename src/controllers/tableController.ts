import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { Server as SocketIOServer } from "socket.io";

// Store socket.io instance (will be set from index.ts)
let io: SocketIOServer | null = null;

export function setSocketIO(server: SocketIOServer) {
    io = server;
}

/**
 * Get all tables for the authenticated tenant
 * Private endpoint for merchants
 */
export async function getTables(req: Request, res: Response) {
    try {
        const tenant = req.tenant!;

        const tables = await prisma.table.findMany({
            where: {
                tenantId: tenant.id,
            },
            orderBy: {
                name: "asc",
            },
        });

        res.json(tables);
    } catch (error) {
        console.error("Error fetching tables:", error);
        res.status(500).json({ error: "Failed to fetch tables" });
    }
}

/**
 * Get table by ID
 * Public endpoint for guests to get table info
 */
export async function getTableById(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const table = await prisma.table.findUnique({
            where: {
                id,
            },
        });

        if (!table) {
            return res.status(404).json({ error: "Table not found" });
        }

        res.json(table);
    } catch (error) {
        console.error("Error fetching table:", error);
        res.status(500).json({ error: "Failed to fetch table" });
    }
}

/**
 * Create a new table
 * Private endpoint for merchants
 */
export async function createTable(req: Request, res: Response) {
    try {
        const { name } = req.body;
        const tenant = req.tenant!;

        if (!name) {
            return res.status(400).json({ error: "Table name is required" });
        }

        const table = await prisma.table.create({
            data: {
                name,
                tenantId: tenant.id,
            },
        });

        res.status(201).json(table);
    } catch (error) {
        console.error("Error creating table:", error);
        res.status(500).json({ error: "Failed to create table" });
    }
}

/**
 * Update table status (LOCKED/ACTIVE)
 * Private endpoint for merchants
 */
export async function updateTableStatus(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const tenant = req.tenant!;

        // Validate status
        const validStatuses = ["LOCKED", "ACTIVE"];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                error: "Invalid status. Must be LOCKED or ACTIVE",
            });
        }

        // Find table and verify ownership
        const table = await prisma.table.findFirst({
            where: {
                id,
                tenantId: tenant.id,
            },
        });

        if (!table) {
            return res.status(404).json({ error: "Table not found" });
        }

        // Update status
        const updatedTable = await prisma.table.update({
            where: { id },
            data: { status },
        });

        // Emit Socket.io event for real-time update
        if (io) {
            const payload = {
                tableId: id,
                tableName: table.name,
                status: status,
                tenantId: tenant.id,
            };

            // Emit to tenant room (dashboard)
            io.to(tenant.id).emit("table_status_changed", payload);

            // Emit to guest room (customers at this table)
            io.to(`guest:${tenant.id}`).emit("table_status_changed", payload);

            console.log(`Table ${table.name} status changed to ${status}`);
        }

        res.json({
            success: true,
            table: updatedTable,
            message: `Table ${table.name} is now ${status.toLowerCase()}`,
        });
    } catch (error) {
        console.error("Error updating table status:", error);
        res.status(500).json({ error: "Failed to update table status" });
    }
}

/**
 * Mark table as paid and reset for next customer
 * Private endpoint for merchants
 * This will emit a socket event to clear user's localStorage and lock the table
 */
export async function markTableAsPaid(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const tenant = req.tenant!;

        // Find table and verify it belongs to the tenant
        const table = await prisma.table.findFirst({
            where: {
                id,
                tenantId: tenant.id,
            },
        });

        if (!table) {
            return res.status(404).json({ error: "Table not found" });
        }

        // Reset status to LOCKED when payment is made
        const updatedTable = await prisma.table.update({
            where: { id },
            data: { status: "LOCKED" },
        });

        // Emit socket event to notify about table payment and status change
        // Send to both tenant room (dashboard) and guest room (customers at this table)
        if (io) {
            const tablePayload = {
                tableId: id,
                tableName: table.name,
                tenantId: tenant.id,
                status: "LOCKED",
            };

            // Emit to tenant room (for dashboard)
            io.to(tenant.id).emit("table_paid", tablePayload);
            // Also emit to guest room (for customers to clear their localStorage)
            io.to(`guest:${tenant.id}`).emit("table_paid", tablePayload);

            // Emit table_status_changed to update UI
            io.to(tenant.id).emit("table_status_changed", tablePayload);
            io.to(`guest:${tenant.id}`).emit(
                "table_status_changed",
                tablePayload
            );

            console.log(
                `Table ${table.name} (${id}) marked as paid and locked. Emitting events.`
            );
        }

        res.json({
            success: true,
            message: `Table ${table.name} has been marked as paid and locked`,
            tableId: id,
            table: updatedTable,
        });
    } catch (error) {
        console.error("Error marking table as paid:", error);
        res.status(500).json({ error: "Failed to mark table as paid" });
    }
}
