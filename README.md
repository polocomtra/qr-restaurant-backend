# QR Restaurant Backend

Backend API server for the QR Restaurant Management SaaS application.

## Tech Stack

-   **Runtime:** Node.js with TypeScript
-   **Framework:** Express.js
-   **Database:** PostgreSQL (via Prisma ORM)
-   **Real-time:** Socket.io
-   **Authentication:** Simple password-based auth (MVP)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root of the `backend` directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/qr_restaurant?schema=public"
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 3. Setup Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database with test data
npm run prisma:seed
```

The seed script creates:

-   Test tenant: `pho-test` (password: `123`)
-   3 tables (Table 1, Table 2, Table 3)
-   3 categories (Appetizers, Main Dishes, Beverages)
-   5 sample products

### 4. Run the Server

**Development:**

```bash
npm run dev
```

**Production:**

```bash
npm run build
npm start
```

The server will start on `http://localhost:3001`

## API Documentation

Interactive API documentation is available via Swagger UI:

-   **Swagger UI:** `http://localhost:3001/docs`

The Swagger documentation includes:

-   Complete API endpoint descriptions
-   Request/response schemas
-   Authentication requirements
-   Example requests and responses
-   Try-it-out functionality for testing endpoints

## Testing

### Quick Start

1. **Start the server:**

    ```bash
    npm run dev
    ```

2. **Seed the database (if not already done):**

    ```bash
    npm run prisma:seed
    ```

3. **Test using Swagger UI (Recommended):**
    - Open `http://localhost:3001/docs` in your browser
    - Try endpoints directly in the UI

### Automated Testing Scripts

**Full API Test:**

```bash
npm run test:api
```

**Quick Test (minimal):**

```bash
bash scripts/quick-test.sh
```

**Socket.io Test:**

```bash
# First get tenantId from login
TENANT_ID=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"slug":"pho-test","password":"123"}' | jq -r '.tenantId')

# Then test socket
npm run test:socket $TENANT_ID
```

### Manual Testing with curl

See [TESTING.md](./TESTING.md) for comprehensive testing guide including:

-   All curl command examples
-   Complete test flow
-   Socket.io testing
-   Common issues and solutions

## API Endpoints

### Public Endpoints (Guests)

-   `GET /api/store/:slug` - Get restaurant menu with categories and products
-   `POST /api/orders` - Create a new order

### Private Endpoints (Merchants)

All private endpoints require `x-tenant-id` header.

-   `POST /api/auth/login` - Login with slug and password

    -   Body: `{ slug: string, password: string }`
    -   Returns: `{ tenantId: string, token: string }`

-   `POST /api/products` - Create a new product

    -   Body: `{ name: string, price: number, categoryId: string, imageUrl?: string, isAvailable?: boolean }`

-   `PUT /api/products/:id` - Update a product

    -   Body: `{ name?: string, price?: number, imageUrl?: string, isAvailable?: boolean, categoryId?: string }`

-   `POST /api/tables` - Create a new table

    -   Body: `{ name: string }`

-   `PUT /api/orders/:id/status` - Update order status
    -   Body: `{ status: 'PENDING' | 'CONFIRMED' | 'DONE' | 'CANCELLED' }`

## Socket.io Events

### Client → Server

-   `join_room` - Join tenant's room to receive order notifications
    -   Payload: `tenantId` (string)

### Server → Client

-   `new_order` - Emitted when a new order is created
    -   Payload: Order object with items

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Database seed script
├── src/
│   ├── config/          # Configuration files (Swagger)
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Auth middleware
│   ├── routes/          # API routes
│   ├── lib/             # Utilities (Prisma client)
│   └── index.ts         # Main server file
├── package.json
└── tsconfig.json
```

## Database Schema

The application uses the following main models:

-   **Tenant** - Restaurant owners
-   **Table** - Restaurant tables
-   **Category** - Menu categories
-   **Product** - Menu items
-   **Order** - Customer orders
-   **OrderItem** - Items within an order

See `prisma/schema.prisma` for the complete schema definition.

## Development Notes

-   Authentication is simplified for MVP (password-based, no JWT)
-   All prices are stored in cents (integers)
-   Order statuses: PENDING → CONFIRMED → DONE or CANCELLED
-   Socket.io rooms are named by `tenantId`
