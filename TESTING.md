# Backend Testing Guide

This guide covers different ways to test the QR Restaurant Backend API.

## Prerequisites

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Ensure database is seeded:**
   ```bash
   npm run prisma:seed
   ```

   This creates:
   - Tenant: `pho-test` (password: `123`)
   - 3 tables, 3 categories, 5 products

## Testing Methods

### 1. Swagger UI (Recommended for Interactive Testing)

Visit: `http://localhost:3001/docs`

**Advantages:**
- Interactive UI
- See all endpoints
- Try requests directly
- View request/response schemas

**Steps:**
1. Open `http://localhost:3001/docs` in your browser
2. Expand any endpoint
3. Click "Try it out"
4. Fill in parameters/body
5. Click "Execute"
6. View response

### 2. Using curl Commands

#### Health Check
```bash
curl http://localhost:3001/health
```

#### Get Store Menu (Public)
```bash
curl http://localhost:3001/api/store/pho-test
```

#### Login (Get Tenant ID)
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"slug":"pho-test","password":"123"}'
```

**Save the `tenantId` from response for authenticated requests!**

#### Create Order (Public)
```bash
# First, get tenantId and productId from login/store endpoints
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "YOUR_TENANT_ID",
    "tableName": "Table 1",
    "items": [
      {
        "productId": "prod-1",
        "quantity": 2,
        "price": 8500,
        "note": "Extra spicy"
      }
    ],
    "total": 17000
  }'
```

#### Create Product (Requires Auth)
```bash
# Replace YOUR_TENANT_ID with actual tenantId from login
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: YOUR_TENANT_ID" \
  -d '{
    "name": "Bun Cha",
    "price": 12000,
    "categoryId": "cat-main",
    "isAvailable": true
  }'
```

#### Update Order Status (Requires Auth)
```bash
# Replace ORDER_ID and YOUR_TENANT_ID
curl -X PUT http://localhost:3001/api/orders/ORDER_ID/status \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: YOUR_TENANT_ID" \
  -d '{"status": "CONFIRMED"}'
```

#### Create Table (Requires Auth)
```bash
curl -X POST http://localhost:3001/api/tables \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: YOUR_TENANT_ID" \
  -d '{"name": "Table 4"}'
```

### 3. Using Postman/Insomnia

1. **Import Collection:**
   - Create a new collection
   - Add requests for each endpoint
   - Set base URL: `http://localhost:3001`

2. **Environment Variables:**
   - `baseUrl`: `http://localhost:3001`
   - `tenantId`: (set after login)
   - `orderId`: (set after creating order)

3. **Authentication:**
   - For private endpoints, add header:
     - Key: `x-tenant-id`
     - Value: `{{tenantId}}`

### 4. Testing Socket.io Events

#### Using Socket.io Client (Node.js)

Create a test file `test-socket.js`:

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('Connected to server');
  
  // Join tenant room (replace with actual tenantId)
  socket.emit('join_room', 'YOUR_TENANT_ID');
  console.log('Joined tenant room');
});

socket.on('new_order', (order) => {
  console.log('New order received:', order);
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});
```

Run: `node test-socket.js`

#### Using Browser Console

```javascript
const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('Connected');
  socket.emit('join_room', 'YOUR_TENANT_ID');
});

socket.on('new_order', (order) => {
  console.log('New order:', order);
});
```

## Complete Test Flow

### Step 1: Get Tenant ID
```bash
# Login to get tenantId
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"slug":"pho-test","password":"123"}'
```

### Step 2: Get Store Menu
```bash
# View available products
curl http://localhost:3001/api/store/pho-test
```

### Step 3: Create an Order
```bash
# Create order (use tenantId and productId from previous steps)
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "TENANT_ID_FROM_STEP_1",
    "tableName": "Table 1",
    "items": [
      {
        "productId": "prod-2",
        "quantity": 1,
        "price": 12500
      }
    ],
    "total": 12500
  }'
```

**Note:** This should trigger a Socket.io `new_order` event if you're listening!

### Step 4: Update Order Status
```bash
# Update order status (use orderId from Step 3)
curl -X PUT http://localhost:3001/api/orders/ORDER_ID/status \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: TENANT_ID_FROM_STEP_1" \
  -d '{"status": "CONFIRMED"}'
```

## Testing Checklist

- [ ] Health check endpoint works
- [ ] Get store menu by slug
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (should fail)
- [ ] Create order (public endpoint)
- [ ] Create product (requires auth)
- [ ] Update product (requires auth)
- [ ] Create table (requires auth)
- [ ] Update order status (requires auth)
- [ ] Socket.io connection works
- [ ] Socket.io `join_room` event works
- [ ] Socket.io `new_order` event is received when order is created
- [ ] Error handling (404, 400, 401, 500)

## Common Issues

### "Cannot GET /"
- ✅ Fixed: Root endpoint now returns API info

### "Restaurant not found"
- Check if database is seeded: `npm run prisma:seed`
- Verify slug is correct: `pho-test`

### "Unauthorized" errors
- Ensure `x-tenant-id` header is set
- Get tenantId from login endpoint first
- Verify tenantId is correct UUID

### Socket.io not connecting
- Check CORS settings in `src/index.ts`
- Verify server is running
- Check browser console for errors

## Next Steps

For automated testing, consider setting up:
- Jest for unit tests
- Supertest for API integration tests
- Test database for isolated testing

