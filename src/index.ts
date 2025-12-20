import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import { apiLimiter, authLimiter } from "./middleware/rateLimiter";
import {
    socketAuthMiddleware,
    validateTenantId,
} from "./middleware/socketAuth";
import storeRoutes from "./routes/storeRoutes";
import orderRoutes from "./routes/orderRoutes";
import authRoutes from "./routes/authRoutes";
import productRoutes from "./routes/productRoutes";
import tableRoutes from "./routes/tableRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import { setSocketIO } from "./controllers/orderController";

// Load environment variables
dotenv.config();

// Allowed origins for CORS - load from env or use defaults
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : [
          "http://localhost:3000",
          "http://localhost:3002",
          "https://app.qrmy.online",
          "https://qrmy.online",
          "https://dashboard.qrmy.online",
      ];

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
    cors: {
        origin: ALLOWED_ORIGINS,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    },
});

const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration - use allowed origins
app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (mobile apps, curl, etc.)
            if (!origin) {
                return callback(null, true);
            }

            if (ALLOWED_ORIGINS.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

// Body parsing middleware
app.use(express.json({ limit: "10kb" })); // Limit body size
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Apply rate limiting to all API routes
app.use("/api", apiLimiter);

// Root endpoint
app.get("/", (req, res) => {
    res.json({
        message: "QR Restaurant Backend API",
        version: "1.0.0",
        endpoints: {
            health: "/health",
            docs: "/docs",
            public: {
                "GET /api/store/:slug": "Get restaurant menu",
                "POST /api/orders": "Create a new order",
                "GET /api/orders/:id": "Get order by ID (for guests)",
                "POST /api/orders/:id/items":
                    "Add items to existing order (for guests)",
                "GET /api/tables/:id": "Get table by ID (for guests)",
            },
            private: {
                "POST /api/auth/login": "Tenant login",
                "POST /api/products": "Create product",
                "PUT /api/products/:id": "Update product",
                "GET /api/tables": "Get all tables",
                "POST /api/tables": "Create table",
                "POST /api/tables/:id/pay":
                    "Mark table as paid (reset for next customer)",
                "PUT /api/orders/:id/status": "Update order status",
            },
        },
        socket: {
            events: {
                join_room:
                    "Join tenant room for order notifications (requires JWT)",
                join_guest_room:
                    "Join guest room for order tracking (no auth required)",
                new_order: "Receive new order notifications",
                order_updated: "Receive order status updates",
                table_paid:
                    "Receive table paid notification (clear localStorage)",
            },
        },
    });
});

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Swagger Documentation
app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
        customCss: ".swagger-ui .topbar { display: none }",
        customSiteTitle: "QR Restaurant API Documentation",
    })
);

// API Routes
app.use("/api/store", storeRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/auth", authLimiter, authRoutes); // Stricter rate limit for auth
app.use("/api/products", productRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/categories", categoryRoutes);

// Set socket.io instance for controllers
import { setSocketIO as setTableSocketIO } from "./routes/tableRoutes";
setSocketIO(io);
setTableSocketIO(io);

// Socket.io authentication middleware
io.use(socketAuthMiddleware);

// Socket.io connection handling
io.on("connection", (socket) => {
    const isAuthenticated = socket.data.authenticated;
    const isGuest = socket.data.isGuest;

    console.log(
        `Client connected: ${socket.id} (${
            isAuthenticated ? "authenticated" : "guest"
        })`
    );

    // Handle tenant joining their room (authenticated users only)
    socket.on("join_room", async (tenantId: string) => {
        // Only authenticated users can join tenant rooms
        if (!isAuthenticated) {
            socket.emit("error", {
                message: "Authentication required to join tenant room",
            });
            return;
        }

        // Verify the user is joining their own tenant room
        if (socket.data.tenantId !== tenantId) {
            socket.emit("error", {
                message: "Cannot join another tenant's room",
            });
            return;
        }

        socket.join(tenantId);
        console.log(
            `Client ${socket.id} joined room: ${tenantId} (authenticated)`
        );
    });

    // Handle guest joining for order tracking (limited access)
    socket.on("join_guest_room", async (tenantId: string) => {
        // Validate tenantId exists
        const isValid = await validateTenantId(tenantId);

        if (!isValid) {
            socket.emit("error", { message: "Invalid tenant" });
            return;
        }

        // Guests join a separate guest room for that tenant
        // They can receive order updates but not tenant-specific notifications
        socket.join(`guest:${tenantId}`);
        console.log(
            `Guest ${socket.id} joined guest room for tenant: ${tenantId}`
        );
    });

    socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

// Start server
httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Socket.io server ready`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});
