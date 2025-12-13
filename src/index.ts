import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import storeRoutes from "./routes/storeRoutes";
import orderRoutes from "./routes/orderRoutes";
import authRoutes from "./routes/authRoutes";
import productRoutes from "./routes/productRoutes";
import tableRoutes from "./routes/tableRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import { setSocketIO } from "./controllers/orderController";

// Load environment variables
dotenv.config();

const ALLOWED_ORIGINS = [
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

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
                join_room: "Join tenant room for order notifications",
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
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/categories", categoryRoutes);

// Set socket.io instance for controllers
import { setSocketIO as setTableSocketIO } from "./routes/tableRoutes";
setSocketIO(io);
setTableSocketIO(io);

// Socket.io connection handling
io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Handle tenant joining their room
    socket.on("join_room", (tenantId: string) => {
        if (tenantId) {
            socket.join(tenantId);
            console.log(`Client ${socket.id} joined room: ${tenantId}`);
        }
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

// Start server
httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Socket.io server ready`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});
