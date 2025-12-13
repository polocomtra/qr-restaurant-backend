import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { Server as SocketIOServer } from "socket.io";

// Store socket.io instance (will be set from index.ts)
let io: SocketIOServer | null = null;

export function setSocketIO(server: SocketIOServer) {
    io = server;
}

/**
 * Create a new order
 * Public endpoint for guests to place orders
 */
export async function createOrder(req: Request, res: Response) {
    try {
        const { tenantId, tableName, items, total } = req.body;

        // Validate required fields
        if (
            !tenantId ||
            !tableName ||
            !items ||
            !Array.isArray(items) ||
            items.length === 0 ||
            !total
        ) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Validate tenant exists
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
        });

        if (!tenant) {
            return res.status(404).json({ error: "Restaurant not found" });
        }

        // Create order with items in a transaction
        const order = await prisma.$transaction(async (tx) => {
            // Fetch all products to get names and validate prices
            const productIds = items.map((item: any) => item.productId);
            const products = await tx.product.findMany({
                where: {
                    id: { in: productIds },
                    tenantId,
                    isAvailable: true,
                },
            });

            // Create a map for quick lookup
            const productMap = new Map(products.map((p) => [p.id, p]));

            // Validate all products exist and are available
            for (const item of items) {
                const product = productMap.get(item.productId);
                if (!product) {
                    throw new Error(
                        `Product ${item.productId} not found or not available`
                    );
                }
            }

            // Create order items with product names from database
            const createdOrder = await tx.order.create({
                data: {
                    tenantId,
                    tableName,
                    status: "PENDING",
                    total,
                    items: {
                        create: items.map((item: any) => {
                            const product = productMap.get(item.productId)!;
                            return {
                                productName: product.name,
                                quantity: item.quantity,
                                price: product.price, // Use current price from DB for data integrity
                                note: item.note || null,
                            };
                        }),
                    },
                },
                include: {
                    items: true,
                },
            });

            return createdOrder;
        });

        // Emit socket event to tenant's room
        if (io) {
            io.to(tenantId).emit("new_order", order);
        }

        res.status(201).json(order);
    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ error: "Failed to create order" });
    }
}

/**
 * Get all orders for a tenant
 * Private endpoint for merchants
 */
export async function getOrders(req: Request, res: Response) {
    try {
        const tenant = (req as any).tenant;

        const orders = await prisma.order.findMany({
            where: {
                tenantId: tenant.id,
            },
            include: {
                items: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        res.json(orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ error: "Failed to fetch orders" });
    }
}

/**
 * Add items to existing order
 * Public endpoint for guests to add more items to a pending order
 */
export async function addItemsToOrder(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { items, additionalTotal } = req.body;

        // Validate required fields
        if (
            !items ||
            !Array.isArray(items) ||
            items.length === 0 ||
            !additionalTotal
        ) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Find order
        const existingOrder = await prisma.order.findUnique({
            where: { id },
            include: { items: true },
        });

        if (!existingOrder) {
            return res.status(404).json({ error: "Order not found" });
        }

        // Only allow adding items to PENDING orders
        if (existingOrder.status !== "PENDING") {
            return res.status(400).json({
                error: "Cannot add items to order. Order status is not PENDING",
            });
        }

        // Fetch products to get names and validate
        const productIds = items.map((item: any) => item.productId);
        const products = await prisma.product.findMany({
            where: {
                id: { in: productIds },
                tenantId: existingOrder.tenantId,
                isAvailable: true,
            },
        });

        const productMap = new Map(products.map((p) => [p.id, p]));

        // Validate all products exist and are available
        for (const item of items) {
            const product = productMap.get(item.productId);
            if (!product) {
                return res.status(400).json({
                    error: `Product ${item.productId} not found or not available`,
                });
            }
        }

        // Update order with new items and new total
        const updatedOrder = await prisma.$transaction(async (tx) => {
            // Add new order items
            await tx.orderItem.createMany({
                data: items.map((item: any) => {
                    const product = productMap.get(item.productId)!;
                    return {
                        orderId: id,
                        productName: product.name,
                        quantity: item.quantity,
                        price: product.price,
                        note: item.note || null,
                    };
                }),
            });

            // Update order total
            const updatedOrder = await tx.order.update({
                where: { id },
                data: {
                    total: existingOrder.total + additionalTotal,
                },
                include: {
                    items: true,
                },
            });

            return updatedOrder;
        });

        // Emit socket event for order update (not new_order since this is an update to existing order)
        if (io) {
            io.to(existingOrder.tenantId).emit("order_updated", updatedOrder);
        }

        res.json(updatedOrder);
    } catch (error) {
        console.error("Error adding items to order:", error);
        res.status(500).json({ error: "Failed to add items to order" });
    }
}

/**
 * Get order by ID
 * Public endpoint for guests to track their order
 */
export async function getOrderById(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const order = await prisma.order.findUnique({
            where: {
                id,
            },
            include: {
                items: true,
            },
        });

        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        res.json(order);
    } catch (error) {
        console.error("Error fetching order:", error);
        res.status(500).json({ error: "Failed to fetch order" });
    }
}

/**
 * Update order status
 * Private endpoint for merchants
 */
export async function updateOrderStatus(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const tenant = (req as any).tenant;

        // Validate status
        const validStatuses = ["PENDING", "CONFIRMED", "DONE", "CANCELLED"];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                error: "Invalid status. Must be one of: PENDING, CONFIRMED, DONE, CANCELLED",
            });
        }

        // Find order and verify it belongs to the tenant
        const order = await prisma.order.findFirst({
            where: {
                id,
                tenantId: tenant.id,
            },
        });

        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        // Update order status
        const updatedOrder = await prisma.order.update({
            where: { id },
            data: { status },
            include: {
                items: true,
            },
        });

        // Emit socket event for order update (for guest tracking)
        if (io) {
            io.emit("order_updated", updatedOrder);
        }

        res.json(updatedOrder);
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ error: "Failed to update order status" });
    }
}
