import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

/**
 * Get all tables for the authenticated tenant
 * Private endpoint for merchants
 */
export async function getTables(req: Request, res: Response) {
    try {
        const tenant = (req as any).tenant;

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
        const tenant = (req as any).tenant;

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
