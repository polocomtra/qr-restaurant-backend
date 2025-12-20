import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "QR Restaurant Backend API",
            version: "1.0.0",
            description:
                "Backend API for QR Restaurant Management SaaS - Multi-tenant restaurant menu and order management system",
            contact: {
                name: "API Support",
            },
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 3001}`,
                description: "Development server",
            },
            {
                url: process.env.API_URL || "https://api.example.com",
                description: "Production server",
            },
        ],
        tags: [
            {
                name: "Store",
                description: "Public endpoints for viewing restaurant menus",
            },
            {
                name: "Auth",
                description: "Authentication endpoints",
            },
            {
                name: "Orders",
                description: "Order management endpoints",
            },
            {
                name: "Products",
                description:
                    "Product management endpoints (requires authentication)",
            },
            {
                name: "Tables",
                description:
                    "Table management endpoints (requires authentication)",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description: "JWT token obtained from login endpoint",
                },
            },
            schemas: {
                Error: {
                    type: "object",
                    properties: {
                        error: {
                            type: "string",
                            description: "Error message",
                        },
                    },
                },
                Tenant: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        name: { type: "string" },
                        slug: { type: "string" },
                        createdAt: { type: "string", format: "date-time" },
                    },
                },
                Category: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        name: { type: "string" },
                        tenantId: { type: "string", format: "uuid" },
                        products: {
                            type: "array",
                            items: { $ref: "#/components/schemas/Product" },
                        },
                    },
                },
                Product: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        name: { type: "string" },
                        price: {
                            type: "integer",
                            description: "Price in cents",
                        },
                        imageUrl: { type: "string", nullable: true },
                        isAvailable: { type: "boolean" },
                        categoryId: { type: "string", format: "uuid" },
                        tenantId: { type: "string", format: "uuid" },
                    },
                },
                StoreResponse: {
                    type: "object",
                    allOf: [
                        { $ref: "#/components/schemas/Tenant" },
                        {
                            type: "object",
                            properties: {
                                categories: {
                                    type: "array",
                                    items: {
                                        $ref: "#/components/schemas/Category",
                                    },
                                },
                            },
                        },
                    ],
                },
                OrderItem: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        orderId: { type: "string", format: "uuid" },
                        productName: { type: "string" },
                        quantity: { type: "integer" },
                        price: {
                            type: "integer",
                            description: "Price in cents",
                        },
                        note: { type: "string", nullable: true },
                    },
                },
                Order: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        tenantId: { type: "string", format: "uuid" },
                        tableName: { type: "string" },
                        status: {
                            type: "string",
                            enum: ["PENDING", "CONFIRMED", "DONE", "CANCELLED"],
                        },
                        total: {
                            type: "integer",
                            description: "Total price in cents",
                        },
                        items: {
                            type: "array",
                            items: { $ref: "#/components/schemas/OrderItem" },
                        },
                        createdAt: { type: "string", format: "date-time" },
                    },
                },
                Table: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        name: { type: "string" },
                        tenantId: { type: "string", format: "uuid" },
                    },
                },
                LoginRequest: {
                    type: "object",
                    required: ["slug", "password"],
                    properties: {
                        slug: { type: "string", example: "pho-test" },
                        password: { type: "string", example: "123" },
                    },
                },
                LoginResponse: {
                    type: "object",
                    properties: {
                        tenantId: { type: "string", format: "uuid" },
                        token: {
                            type: "string",
                            description: "JWT token for API authentication",
                        },
                        expiresIn: {
                            type: "string",
                            description: "Token expiration time",
                            example: "24h",
                        },
                    },
                },
                CreateOrderRequest: {
                    type: "object",
                    required: ["tenantId", "tableName", "items", "total"],
                    properties: {
                        tenantId: { type: "string", format: "uuid" },
                        tableName: { type: "string", example: "Table 1" },
                        items: {
                            type: "array",
                            items: {
                                type: "object",
                                required: ["productId", "quantity", "price"],
                                properties: {
                                    productId: {
                                        type: "string",
                                        format: "uuid",
                                    },
                                    quantity: { type: "integer", minimum: 1 },
                                    price: {
                                        type: "integer",
                                        description: "Price in cents",
                                    },
                                    note: { type: "string", nullable: true },
                                },
                            },
                        },
                        total: {
                            type: "integer",
                            description: "Total price in cents",
                        },
                    },
                },
                CreateProductRequest: {
                    type: "object",
                    required: ["name", "price", "categoryId"],
                    properties: {
                        name: { type: "string" },
                        price: {
                            type: "integer",
                            description: "Price in cents",
                        },
                        categoryId: { type: "string", format: "uuid" },
                        imageUrl: { type: "string", nullable: true },
                        isAvailable: { type: "boolean", default: true },
                    },
                },
                UpdateProductRequest: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        price: {
                            type: "integer",
                            description: "Price in cents",
                        },
                        categoryId: { type: "string", format: "uuid" },
                        imageUrl: { type: "string", nullable: true },
                        isAvailable: { type: "boolean" },
                    },
                },
                CreateTableRequest: {
                    type: "object",
                    required: ["name"],
                    properties: {
                        name: { type: "string", example: "Table 1" },
                    },
                },
                UpdateOrderStatusRequest: {
                    type: "object",
                    required: ["status"],
                    properties: {
                        status: {
                            type: "string",
                            enum: ["PENDING", "CONFIRMED", "DONE", "CANCELLED"],
                        },
                    },
                },
            },
        },
    },
    apis: ["./src/routes/*.ts", "./src/index.ts"], // Path to the API files
};

export const swaggerSpec = swaggerJsdoc(options);
