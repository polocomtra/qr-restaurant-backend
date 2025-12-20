import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

/**
 * Hash password using bcrypt
 */
async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

async function main() {
    console.log("🌱 Seeding database...");

    // Hash the password before storing
    const hashedPassword = await hashPassword("123");

    // Create test tenant with hashed password
    const tenant = await prisma.tenant.upsert({
        where: { slug: "pho-test" },
        update: {
            // Update password to hashed version if tenant exists
            password: hashedPassword,
        },
        create: {
            name: "Pho Test Restaurant",
            slug: "pho-test",
            password: hashedPassword,
        },
    });

    console.log("✅ Created tenant:", tenant.slug);
    console.log("   Password: 123 (hashed with bcrypt)");

    // Create tables
    const tables = await Promise.all([
        prisma.table.upsert({
            where: { id: "table-1" },
            update: {},
            create: {
                id: "table-1",
                name: "Table 1",
                tenantId: tenant.id,
            },
        }),
        prisma.table.upsert({
            where: { id: "table-2" },
            update: {},
            create: {
                id: "table-2",
                name: "Table 2",
                tenantId: tenant.id,
            },
        }),
        prisma.table.upsert({
            where: { id: "table-3" },
            update: {},
            create: {
                id: "table-3",
                name: "Table 3",
                tenantId: tenant.id,
            },
        }),
    ]);

    console.log("✅ Created tables:", tables.length);

    // Create categories
    const appetizers = await prisma.category.upsert({
        where: { id: "cat-appetizers" },
        update: {},
        create: {
            id: "cat-appetizers",
            name: "Appetizers",
            tenantId: tenant.id,
        },
    });

    const mainDishes = await prisma.category.upsert({
        where: { id: "cat-main" },
        update: {},
        create: {
            id: "cat-main",
            name: "Main Dishes",
            tenantId: tenant.id,
        },
    });

    const beverages = await prisma.category.upsert({
        where: { id: "cat-beverages" },
        update: {},
        create: {
            id: "cat-beverages",
            name: "Beverages",
            tenantId: tenant.id,
        },
    });

    console.log("✅ Created categories:", 3);

    // Create products
    const products = await Promise.all([
        prisma.product.upsert({
            where: { id: "prod-1" },
            update: {},
            create: {
                id: "prod-1",
                name: "Spring Rolls",
                price: 8500, // in cents
                imageUrl: null,
                isAvailable: true,
                categoryId: appetizers.id,
                tenantId: tenant.id,
            },
        }),
        prisma.product.upsert({
            where: { id: "prod-2" },
            update: {},
            create: {
                id: "prod-2",
                name: "Pho Bo (Beef Noodle Soup)",
                price: 12500, // in cents
                imageUrl: null,
                isAvailable: true,
                categoryId: mainDishes.id,
                tenantId: tenant.id,
            },
        }),
        prisma.product.upsert({
            where: { id: "prod-3" },
            update: {},
            create: {
                id: "prod-3",
                name: "Pho Ga (Chicken Noodle Soup)",
                price: 11500, // in cents
                imageUrl: null,
                isAvailable: true,
                categoryId: mainDishes.id,
                tenantId: tenant.id,
            },
        }),
        prisma.product.upsert({
            where: { id: "prod-4" },
            update: {},
            create: {
                id: "prod-4",
                name: "Vietnamese Iced Coffee",
                price: 6500, // in cents
                imageUrl: null,
                isAvailable: true,
                categoryId: beverages.id,
                tenantId: tenant.id,
            },
        }),
        prisma.product.upsert({
            where: { id: "prod-5" },
            update: {},
            create: {
                id: "prod-5",
                name: "Fresh Lime Soda",
                price: 5500, // in cents
                imageUrl: null,
                isAvailable: true,
                categoryId: beverages.id,
                tenantId: tenant.id,
            },
        }),
    ]);

    console.log("✅ Created products:", products.length);
    console.log("🎉 Seeding completed!");
}

main()
    .catch((e) => {
        console.error("❌ Error seeding database:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
