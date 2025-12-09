/**
 * Socket.io Test Script
 *
 * This script tests Socket.io real-time functionality
 * Run: npm run test:socket
 *
 * Make sure the server is running first!
 */

import { io, Socket } from "socket.io-client";

const SERVER_URL = process.env.SERVER_URL || "http://localhost:3001";
const TENANT_ID = process.argv[2]; // Pass tenantId as argument

if (!TENANT_ID) {
    console.error("❌ Please provide tenantId as argument:");
    console.error("   npm run test:socket <tenantId>");
    console.error("\n💡 Get tenantId by running:");
    console.error("   curl -X POST http://localhost:3001/api/auth/login \\");
    console.error("     -H 'Content-Type: application/json' \\");
    console.error('     -d \'{"slug":"pho-test","password":"123"}\'');
    process.exit(1);
}

console.log("🔌 Connecting to Socket.io server...");
console.log(`   Server: ${SERVER_URL}`);
console.log(`   Tenant ID: ${TENANT_ID}`);
console.log("");

const socket: Socket = io(SERVER_URL, {
    transports: ["websocket", "polling"],
});

socket.on("connect", () => {
    console.log("✅ Connected to server");
    console.log(`   Socket ID: ${socket.id}`);
    console.log("");

    // Join tenant room
    console.log(`📡 Joining tenant room: ${TENANT_ID}`);
    socket.emit("join_room", TENANT_ID);
    console.log("✅ Joined room successfully");
    console.log("");
    console.log("👂 Listening for 'new_order' events...");
    console.log("💡 Create an order via API to test:");
    console.log(`   curl -X POST ${SERVER_URL}/api/orders \\`);
    console.log(`     -H 'Content-Type: application/json' \\`);
    console.log(
        `     -d '{"tenantId":"${TENANT_ID}","tableName":"Table 1","items":[{"productId":"prod-1","quantity":1,"price":8500}],"total":8500}'`
    );
    console.log("");
});

socket.on("new_order", (order: any) => {
    console.log("🎉 NEW ORDER RECEIVED!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Order ID: ${order.id}`);
    console.log(`Table: ${order.tableName}`);
    console.log(`Status: ${order.status}`);
    console.log(`Total: $${(order.total / 100).toFixed(2)}`);
    console.log(`Items: ${order.items.length}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");
});

socket.on("disconnect", () => {
    console.log("❌ Disconnected from server");
});

socket.on("connect_error", (error: Error) => {
    console.error("❌ Connection error:", error.message);
    console.error("   Make sure the server is running!");
    process.exit(1);
});

// Keep the script running
console.log("Press Ctrl+C to exit");
process.on("SIGINT", () => {
    console.log("\n👋 Disconnecting...");
    socket.disconnect();
    process.exit(0);
});
