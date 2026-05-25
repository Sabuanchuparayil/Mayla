import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

async function main() {
  const hashedPassword = await bcrypt.hash('admin123!', 12);

  await prisma.user.upsert({
    where: { email: 'admin@mayla.app' },
    update: {},
    create: {
      email: 'admin@mayla.app',
      username: 'admin',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
