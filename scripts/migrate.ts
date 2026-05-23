import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const dbPath = path.join(process.cwd(), 'db.json');

async function main() {
    if (!fs.existsSync(dbPath)) {
        console.log('No db.json found');
        return;
    }

    const rawData = fs.readFileSync(dbPath, 'utf-8');
    const data = JSON.parse(rawData);

    console.log('Migrating users...');
    for (const user of data.users) {
        await prisma.user.upsert({
            where: { email: user.email },
            update: {},
            create: {
                name: user.name,
                email: user.email,
                password: user.password,

                isVerified: user.isVerified,
                balance: user.balance
            }
        });
    }

    console.log('Migrating products...');
    for (const product of data.products) {
        await prisma.product.upsert({
            where: { id: product.id },
            update: {},
            create: {
                id: product.id,
                name: product.name,
                description: product.description,
                price: product.price,
                image: product.image,
                stock: product.stock,
                available: product.available
            }
        });
    }

    console.log('Migrating transactions...');
    for (const tx of data.transactions) {
        await prisma.transaction.upsert({
            where: { id: tx.id },
            update: {},
            create: {
                id: tx.id,
                userId: tx.userId,
                type: tx.type,
                description: tx.description,
                amount: tx.amount,
                date: new Date(tx.date),
                status: tx.status
            }
        });
    }

    console.log('Migration complete');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
