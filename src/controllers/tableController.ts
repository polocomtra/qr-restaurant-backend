import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

/**
 * Create a new table
 * Private endpoint for merchants
 */
export async function createTable(req: Request, res: Response) {
  try {
    const { name } = req.body;
    const tenant = (req as any).tenant;

    if (!name) {
      return res.status(400).json({ error: 'Table name is required' });
    }

    const table = await prisma.table.create({
      data: {
        name,
        tenantId: tenant.id,
      },
    });

    res.status(201).json(table);
  } catch (error) {
    console.error('Error creating table:', error);
    res.status(500).json({ error: 'Failed to create table' });
  }
}

