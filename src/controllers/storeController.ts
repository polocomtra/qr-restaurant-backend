import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

/**
 * Get restaurant details with nested categories and products
 * Public endpoint for guest menu viewing
 */
export async function getStoreBySlug(req: Request, res: Response) {
  try {
    const { slug } = req.params;

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      include: {
        categories: {
          include: {
            products: {
              where: {
                isAvailable: true, // Only show available products
              },
              orderBy: {
                name: 'asc',
              },
            },
          },
          orderBy: {
            name: 'asc',
          },
        },
      },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Remove password from response
    const { password, ...tenantData } = tenant;

    res.json(tenantData);
  } catch (error) {
    console.error('Error fetching store:', error);
    res.status(500).json({ error: 'Failed to fetch store data' });
  }
}

