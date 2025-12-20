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
 * Mark table as paid and reset for next customer
 * Private endpoint for merchants
 * This will emit a socket event to clear user's localStorage
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

        // Emit socket event to notify about table payment
        // Send to both tenant room (dashboard) and guest room (customers at this table)
        if (io) {
            const tablePayload = {
                tableId: id,
                tableName: table.name,
                tenantId: tenant.id,
            };

            // Emit to tenant room (for dashboard)
            io.to(tenant.id).emit("table_paid", tablePayload);
            // Also emit to guest room (for customers to clear their localStorage)
            io.to(`guest:${tenant.id}`).emit("table_paid", tablePayload);

            console.log(
                `Table ${table.name} (${id}) marked as paid. Emitting table_paid event.`
            );
        }

        res.json({
            success: true,
            message: `Table ${table.name} has been marked as paid`,
            tableId: id,
        });
    } catch (error) {
        console.error("Error marking table as paid:", error);
        res.status(500).json({ error: "Failed to mark table as paid" });
    }
}
