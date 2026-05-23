import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const adminEmail = 'admin@admin.com';
    const adminPassword = 'fear@rootuser';

    const user = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            role: 'ADMIN',
            password: adminPassword,
        },
        create: {
            email: adminEmail,
            name: 'Admin',
            password: adminPassword,
            role: 'ADMIN',
            isVerified: true
        },
    });

    console.log({ user });
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
