import bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

async function syncLocation(profileId: string, lat: number, lng: number) {
  await prisma.$executeRaw`
    UPDATE profiles
    SET location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
        latitude = ${lat},
        longitude = ${lng},
        "updatedAt" = NOW()
    WHERE id = ${profileId}
  `;
}

type DemoUser = {
  email: string;
  phone: string;
  username: string;
  name: string;
  gender: string;
  birthDate: Date;
  city: string;
  lat: number;
  lng: number;
  bio: string;
  interests: string[];
  tier: 'FREE' | 'GOLD' | 'PLATINUM';
};

const DEMO_USERS: DemoUser[] = [
  // --- UAE ---
  { email: 'sara@demo.mayla', phone: '971501000001', username: 'sara_ae', name: 'Sara Al-Maktoum', gender: 'FEMALE', birthDate: new Date('1998-03-15'), city: 'Dubai', lat: 25.2048, lng: 55.2708, bio: 'Interior designer by day, coffee connoisseur by night. Looking for someone who enjoys sunsets at Kite Beach.', interests: ['coffee', 'travel', 'design', 'photography'], tier: 'GOLD' },
  { email: 'omar@demo.mayla', phone: '971501000002', username: 'omar_ae', name: 'Omar Hassan', gender: 'MALE', birthDate: new Date('1995-07-22'), city: 'Abu Dhabi', lat: 24.4539, lng: 54.3773, bio: "Software engineer who lifts. If you can beat me at padel, I'll buy dinner.", interests: ['fitness', 'food', 'tech', 'padel'], tier: 'FREE' },
  { email: 'layla@demo.mayla', phone: '971501000003', username: 'layla_ae', name: 'Layla Noor', gender: 'FEMALE', birthDate: new Date('2000-11-08'), city: 'Sharjah', lat: 25.3463, lng: 55.4209, bio: 'Art student at UoS. I paint, I sing, I overthink — in that order.', interests: ['art', 'music', 'poetry', 'cinema'], tier: 'FREE' },
  { email: 'ahmed@demo.mayla', phone: '971501000004', username: 'ahmed_ae', name: 'Ahmed Khalifa', gender: 'MALE', birthDate: new Date('1993-01-30'), city: 'Dubai', lat: 25.1972, lng: 55.2744, bio: 'Chef at a fine-dining restaurant. I speak fluent Italian... food.', interests: ['cooking', 'travel', 'wine', 'scuba'], tier: 'PLATINUM' },
  { email: 'fatima@demo.mayla', phone: '971501000005', username: 'fatima_ae', name: 'Fatima Rashid', gender: 'FEMALE', birthDate: new Date('1997-05-12'), city: 'Ajman', lat: 25.4052, lng: 55.5136, bio: 'Pharmacist with a serious book addiction. Currently reading three novels at once.', interests: ['reading', 'yoga', 'skincare', 'hiking'], tier: 'GOLD' },

  // --- Saudi Arabia ---
  { email: 'nora@demo.mayla', phone: '966501000006', username: 'nora_sa', name: 'Nora Al-Qahtani', gender: 'FEMALE', birthDate: new Date('1999-09-03'), city: 'Riyadh', lat: 24.7136, lng: 46.6753, bio: 'Marketing lead at a startup. Weekend explorer of hidden cafes. Dog mom.', interests: ['marketing', 'dogs', 'coffee', 'hiking'], tier: 'FREE' },
  { email: 'faisal@demo.mayla', phone: '966501000007', username: 'faisal_sa', name: 'Faisal Bin Saleh', gender: 'MALE', birthDate: new Date('1994-12-18'), city: 'Jeddah', lat: 21.4858, lng: 39.1925, bio: 'Architect. I design buildings and over-engineer dinner plans.', interests: ['architecture', 'photography', 'tennis', 'travel'], tier: 'GOLD' },
  { email: 'hana@demo.mayla', phone: '966501000008', username: 'hana_sa', name: 'Hana Turki', gender: 'FEMALE', birthDate: new Date('1996-06-25'), city: 'Dammam', lat: 26.3927, lng: 49.9777, bio: 'Dentist who loves road trips. My GPS history is more interesting than my dating history.', interests: ['cars', 'travel', 'movies', 'food'], tier: 'FREE' },

  // --- Bahrain ---
  { email: 'zain@demo.mayla', phone: '973501000009', username: 'zain_bh', name: 'Zain Al-Doseri', gender: 'MALE', birthDate: new Date('1997-08-14'), city: 'Manama', lat: 26.2285, lng: 50.5860, bio: 'Banker who surfs on weekends. Yes, Bahrain has waves — sort of.', interests: ['surfing', 'finance', 'gaming', 'sushi'], tier: 'PLATINUM' },
  { email: 'mariam@demo.mayla', phone: '973501000010', username: 'mariam_bh', name: 'Mariam Jawad', gender: 'FEMALE', birthDate: new Date('2001-02-20'), city: 'Manama', lat: 26.2235, lng: 50.5876, bio: "Med student. If I cancel plans, it's probably because of an anatomy exam.", interests: ['medicine', 'fitness', 'cooking', 'cats'], tier: 'FREE' },

  // --- Kuwait ---
  { email: 'khalid@demo.mayla', phone: '965501000011', username: 'khalid_kw', name: 'Khalid Al-Sabah', gender: 'MALE', birthDate: new Date('1992-04-09'), city: 'Kuwait City', lat: 29.3759, lng: 47.9774, bio: "Pilot. I've seen 40 countries but still can't find someone who likes pineapple on pizza.", interests: ['aviation', 'travel', 'food', 'diving'], tier: 'GOLD' },
  { email: 'dana@demo.mayla', phone: '965501000012', username: 'dana_kw', name: 'Dana Al-Shammari', gender: 'FEMALE', birthDate: new Date('1998-10-05'), city: 'Kuwait City', lat: 29.3697, lng: 47.9783, bio: "Fashion buyer. I judge books by their covers and I'm usually right.", interests: ['fashion', 'shopping', 'brunch', 'pilates'], tier: 'PLATINUM' },

  // --- Oman ---
  { email: 'yusuf@demo.mayla', phone: '968501000013', username: 'yusuf_om', name: 'Yusuf Al-Balushi', gender: 'MALE', birthDate: new Date('1996-03-28'), city: 'Muscat', lat: 23.5880, lng: 58.3829, bio: 'Marine biologist. I spend more time underwater than on dating apps.', interests: ['diving', 'marine life', 'camping', 'photography'], tier: 'FREE' },
  { email: 'amira@demo.mayla', phone: '968501000014', username: 'amira_om', name: 'Amira Said', gender: 'FEMALE', birthDate: new Date('1999-07-16'), city: 'Muscat', lat: 23.5859, lng: 58.4059, bio: 'Teacher & part-time potter. I make bowls and bad puns.', interests: ['pottery', 'teaching', 'gardening', 'comedy'], tier: 'FREE' },

  // --- Qatar ---
  { email: 'rashid@demo.mayla', phone: '974501000015', username: 'rashid_qa', name: 'Rashid Al-Thani', gender: 'MALE', birthDate: new Date('1991-11-12'), city: 'Doha', lat: 25.2854, lng: 51.5310, bio: 'Sports journalist. I can talk about football for 90 minutes straight.', interests: ['football', 'writing', 'chess', 'coffee'], tier: 'GOLD' },
];

const COUNTRY_FROM_PHONE: Record<string, string> = {
  '971': 'AE', '966': 'SA', '973': 'BH', '965': 'KW', '968': 'OM', '974': 'QA',
};

function countryFromPhone(phone: string): string {
  for (const [prefix, country] of Object.entries(COUNTRY_FROM_PHONE)) {
    if (phone.startsWith(prefix)) return country;
  }
  return 'AE';
}

async function main() {
  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD ?? 'admin123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@mayla.app' },
    update: { onboardingCompleted: true, verified: true, name: 'Admin User' },
    create: {
      email: 'admin@mayla.app',
      phone: '971500000000',
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
      bio: 'Platform administrator',
      gender: 'MALE',
      birthDate: new Date('1990-01-01'),
      city: 'Dubai',
      country: 'AE',
      interests: ['admin'],
    },
  });
  await syncLocation(adminProfile.id, 25.2048, 55.2708);

  await prisma.subscription.upsert({
    where: { userId: admin.id },
    create: { userId: admin.id, tier: 'PLATINUM', status: 'ACTIVE' },
    update: { tier: 'PLATINUM', status: 'ACTIVE' },
  });

  let count = 0;
  for (const demo of DEMO_USERS) {
    const country = countryFromPhone(demo.phone);

    const user = await prisma.user.upsert({
      where: { email: demo.email },
      update: { onboardingCompleted: true, verified: true, name: demo.name },
      create: {
        email: demo.email,
        phone: demo.phone,
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
        gender: demo.gender,
        birthDate: demo.birthDate,
        city: demo.city,
        interests: demo.interests,
      },
      create: {
        userId: user.id,
        displayName: demo.name,
        bio: demo.bio,
        gender: demo.gender,
        birthDate: demo.birthDate,
        city: demo.city,
        country,
        interests: demo.interests,
      },
    });
    await syncLocation(profile.id, demo.lat, demo.lng);

    await prisma.subscription.upsert({
      where: { userId: user.id },
      create: { userId: user.id, tier: demo.tier, status: 'ACTIVE' },
      update: { tier: demo.tier, status: 'ACTIVE' },
    });

    count++;
  }

  console.log(`Seeded 1 admin + ${count} demo users across 6 countries`);
  console.log('Password for all: admin123!');
  console.log('OTP for all: 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
