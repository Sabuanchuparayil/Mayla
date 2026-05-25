import bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { syncProfileLocation } from '../src/lib/geo';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

const DEMO_USERS = [
  { email: 'sara@demo.mayla', username: 'sara', name: 'Sara', city: 'Dubai', lat: 25.2048, lng: 55.2708, bio: 'Coffee lover · Verified', interests: ['coffee', 'travel'] },
  { email: 'omar@demo.mayla', username: 'omar', name: 'Omar', city: 'Abu Dhabi', lat: 24.4539, lng: 54.3773, bio: 'Fitness & food', interests: ['fitness', 'food'] },
  { email: 'layla@demo.mayla', username: 'layla', name: 'Layla', city: 'Sharjah', lat: 25.3463, lng: 55.4209, bio: 'Art & music', interests: ['art', 'music'] },
];

async function main() {
  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD ?? 'admin123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@mayla.app' },
    update: {
      onboardingCompleted: true,
      verified: true,
      name: 'Admin User',
    },
    create: {
      email: 'admin@mayla.app',
      username: 'admin',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      onboardingCompleted: true,
      emailVerified: true,
      verified: true,
    },
  });

  const adminProfile = await prisma.profile.upsert({
    where: { userId: admin.id },
    update: { displayName: 'Admin User' },
    create: {
      userId: admin.id,
      displayName: 'Admin User',
      city: 'Dubai',
      country: 'AE',
      interests: ['admin'],
    },
  });
  await syncProfileLocation(adminProfile.id, 25.2048, 55.2708);

  await prisma.subscription.upsert({
    where: { userId: admin.id },
    create: { userId: admin.id, tier: 'PLATINUM', status: 'ACTIVE' },
    update: { tier: 'PLATINUM', status: 'ACTIVE' },
  });

  for (const demo of DEMO_USERS) {
    const user = await prisma.user.upsert({
      where: { email: demo.email },
      update: {
        onboardingCompleted: true,
        verified: true,
        name: demo.name,
      },
      create: {
        email: demo.email,
        username: demo.username,
        password: hashedPassword,
        name: demo.name,
        onboardingCompleted: true,
        emailVerified: true,
        verified: true,
      },
    });

    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        displayName: demo.name,
        bio: demo.bio,
        city: demo.city,
        interests: demo.interests,
      },
      create: {
        userId: user.id,
        displayName: demo.name,
        bio: demo.bio,
        city: demo.city,
        country: 'AE',
        interests: demo.interests,
      },
    });
    await syncProfileLocation(profile.id, demo.lat, demo.lng);

    await prisma.subscription.upsert({
      where: { userId: user.id },
      create: { userId: user.id, tier: 'FREE', status: 'ACTIVE' },
      update: {},
    });
  }

  console.log('Seeded admin + demo users (password: admin123! for all)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
