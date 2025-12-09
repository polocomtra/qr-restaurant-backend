import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

/**
 * Simple authentication middleware for MVP
 * Checks if tenantId is provided in headers and validates it exists
 */
export async function authenticateTenant(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      return res.status(401).json({ error: 'Missing tenant ID' });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return res.status(401).json({ error: 'Invalid tenant ID' });
    }

    // Attach tenant to request for use in controllers
    (req as any).tenant = tenant;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

