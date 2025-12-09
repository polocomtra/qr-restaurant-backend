import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

/**
 * Login endpoint for merchants
 * Returns tenantId and a simple token (for MVP, just return tenantId)
 */
export async function login(req: Request, res: Response) {
  try {
    const { slug, password } = req.body;

    if (!slug || !password) {
      return res.status(400).json({ error: 'Slug and password are required' });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant || tenant.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // For MVP, return tenantId as token
    // In production, you would generate a JWT token here
    res.json({
      tenantId: tenant.id,
      token: tenant.id, // Simple token for MVP
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
}

