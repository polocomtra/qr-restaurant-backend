import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

/**
 * Create a new product
 * Private endpoint for merchants
 */
export async function createProduct(req: Request, res: Response) {
    try {
        const { name, price, imageUrl, isAvailable, categoryId } = req.body;
        const tenant = req.tenant!;

        if (!name || !price || !categoryId) {
            return res
                .status(400)
                .json({ error: "Name, price, and categoryId are required" });
        }

        // Verify category belongs to tenant
        const category = await prisma.category.findFirst({
            where: {
                id: categoryId,
                tenantId: tenant.id,
            },
        });

        if (!category) {
            return res.status(404).json({ error: "Category not found" });
        }

        const product = await prisma.product.create({
            data: {
                name,
                price: parseInt(price),
                imageUrl: imageUrl || null,
                isAvailable: isAvailable !== undefined ? isAvailable : true,
                categoryId,
                tenantId: tenant.id,
            },
        });

        res.status(201).json(product);
    } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({ error: "Failed to create product" });
    }
}

/**
 * Update product (status, price, etc.)
 * Private endpoint for merchants
 */
export async function updateProduct(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { name, price, imageUrl, isAvailable, categoryId } = req.body;
        const tenant = req.tenant!;

        // Find product and verify it belongs to tenant
        const product = await prisma.product.findFirst({
            where: {
                id,
                tenantId: tenant.id,
            },
        });

        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        // If categoryId is being updated, verify it belongs to tenant
        if (categoryId) {
            const category = await prisma.category.findFirst({
                where: {
                    id: categoryId,
                    tenantId: tenant.id,
                },
            });

            if (!category) {
                return res.status(404).json({ error: "Category not found" });
            }
        }

        // Build update data
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (price !== undefined) updateData.price = parseInt(price);
        if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
        if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
        if (categoryId !== undefined) updateData.categoryId = categoryId;

        const updatedProduct = await prisma.product.update({
            where: { id },
            data: updateData,
        });

        res.json(updatedProduct);
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ error: "Failed to update product" });
    }
}

/**
 * Delete a product
 * Private endpoint for merchants
 */
export async function deleteProduct(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const tenant = req.tenant!;

        // Find product and verify it belongs to tenant
        const product = await prisma.product.findFirst({
            where: {
                id,
                tenantId: tenant.id,
            },
        });

        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        // Delete the product
        await prisma.product.delete({
            where: { id },
        });

        res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ error: "Failed to delete product" });
    }
}
