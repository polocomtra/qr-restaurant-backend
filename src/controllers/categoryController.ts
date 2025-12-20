import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

/**
 * Get all categories for a tenant
 * Private endpoint for merchants
 */
export async function getCategories(req: Request, res: Response) {
    try {
        const tenant = req.tenant!;

        const categories = await prisma.category.findMany({
            where: {
                tenantId: tenant.id,
            },
            include: {
                products: true,
            },
            orderBy: {
                name: "asc",
            },
        });

        res.json(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ error: "Failed to fetch categories" });
    }
}

/**
 * Create a new category
 * Private endpoint for merchants
 */
export async function createCategory(req: Request, res: Response) {
    try {
        const { name } = req.body;
        const tenant = req.tenant!;

        if (!name || name.trim() === "") {
            return res.status(400).json({ error: "Category name is required" });
        }

        // Check if category with same name already exists for this tenant
        const existingCategory = await prisma.category.findFirst({
            where: {
                name: name.trim(),
                tenantId: tenant.id,
            },
        });

        if (existingCategory) {
            return res
                .status(400)
                .json({ error: "Category with this name already exists" });
        }

        const category = await prisma.category.create({
            data: {
                name: name.trim(),
                tenantId: tenant.id,
            },
        });

        res.status(201).json(category);
    } catch (error) {
        console.error("Error creating category:", error);
        res.status(500).json({ error: "Failed to create category" });
    }
}

/**
 * Update a category
 * Private endpoint for merchants
 */
export async function updateCategory(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const tenant = req.tenant!;

        if (!name || name.trim() === "") {
            return res.status(400).json({ error: "Category name is required" });
        }

        // Find category and verify it belongs to tenant
        const category = await prisma.category.findFirst({
            where: {
                id,
                tenantId: tenant.id,
            },
        });

        if (!category) {
            return res.status(404).json({ error: "Category not found" });
        }

        // Check if another category with same name already exists
        const existingCategory = await prisma.category.findFirst({
            where: {
                name: name.trim(),
                tenantId: tenant.id,
                id: { not: id },
            },
        });

        if (existingCategory) {
            return res
                .status(400)
                .json({ error: "Category with this name already exists" });
        }

        const updatedCategory = await prisma.category.update({
            where: { id },
            data: {
                name: name.trim(),
            },
        });

        res.json(updatedCategory);
    } catch (error) {
        console.error("Error updating category:", error);
        res.status(500).json({ error: "Failed to update category" });
    }
}

/**
 * Delete a category
 * Private endpoint for merchants
 */
export async function deleteCategory(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const tenant = req.tenant!;

        // Find category and verify it belongs to tenant
        const category = await prisma.category.findFirst({
            where: {
                id,
                tenantId: tenant.id,
            },
            include: {
                products: true,
            },
        });

        if (!category) {
            return res.status(404).json({ error: "Category not found" });
        }

        // Check if category has products
        if (category.products.length > 0) {
            return res.status(400).json({
                error: "Cannot delete category with existing products. Please remove or move products first.",
            });
        }

        // Delete the category
        await prisma.category.delete({
            where: { id },
        });

        res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({ error: "Failed to delete category" });
    }
}
