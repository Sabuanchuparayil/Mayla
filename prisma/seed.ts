import bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

async function ensurePostgis(): Promise<boolean> {
  try {
    await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS postgis');
    const rows = await prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') AS exists
    `;
    return rows[0]?.exists ?? false;
  } catch {
    return false;
  }
}

async function syncLocation(
  profileId: string,
  lat: number,
  lng: number,
  hasPostgis: boolean,
) {
  if (hasPostgis) {
    await prisma.$executeRaw`
      UPDATE profiles
      SET location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          latitude = ${lat},
          longitude = ${lng},
          "updatedAt" = NOW()
      WHERE id = ${profileId}
    `;
    return;
  }

  await prisma.profile.update({
    where: { id: profileId },
    data: { latitude: lat, longitude: lng },
  });
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

const PROFILE_ENRICHMENTS: Record<
  string,
  {
    relationshipGoal:
      | 'MARRIAGE'
      | 'LIFE_PARTNER'
      | 'RELATIONSHIP'
      | 'CASUAL_DATING'
      | 'COMPANIONSHIP'
      | 'SOCIAL_FUN'
      | 'RATHER_NOT_SAY';
    nationality: string;
    languages: string[];
    lifestyle: string[];
    industry: string;
    education: string;
    personalityPrompts: { prompt: string; answer: string }[];
  }
> = {
  'sara@demo.mayla': {
    relationshipGoal: 'RELATIONSHIP',
    nationality: 'AE',
    languages: ['Arabic', 'English'],
    lifestyle: ['Coffee Addict', 'Travel', 'Fine Dining'],
    industry: 'Design',
    education: "Bachelor's",
    personalityPrompts: [{ prompt: 'My ideal Friday looks like...', answer: 'Sunset at Kite Beach with good coffee.' }],
  },
  'omar@demo.mayla': {
    relationshipGoal: 'CASUAL_DATING',
    nationality: 'AE',
    languages: ['Arabic', 'English'],
    lifestyle: ['Fitness Lover', 'Foodie'],
    industry: 'Tech',
    education: "Bachelor's",
    personalityPrompts: [{ prompt: 'The way to my heart is...', answer: 'Beating me at padel.' }],
  },
  'layla@demo.mayla': {
    relationshipGoal: 'RELATIONSHIP',
    nationality: 'AE',
    languages: ['Arabic', 'English'],
    lifestyle: ['Bookworm', 'Adventurer'],
    industry: 'Student',
    education: "Bachelor's",
    personalityPrompts: [{ prompt: 'I geek out about...', answer: 'Watercolour and indie music.' }],
  },
  'ahmed@demo.mayla': {
    relationshipGoal: 'COMPANIONSHIP',
    nationality: 'AE',
    languages: ['Arabic', 'English', 'French'],
    lifestyle: ['Fine Dining', 'Travel', 'Luxury Lifestyle'],
    industry: 'Hospitality',
    education: "Bachelor's",
    personalityPrompts: [{ prompt: "I'll pick the restaurant if you pick...", answer: 'The wine. Always the wine.' }],
  },
  'fatima@demo.mayla': {
    relationshipGoal: 'MARRIAGE',
    nationality: 'AE',
    languages: ['Arabic', 'English'],
    lifestyle: ['Bookworm', 'Fitness Lover'],
    industry: 'Healthcare',
    education: "Master's",
    personalityPrompts: [{ prompt: 'My family would describe me as...', answer: 'Always reading something.' }],
  },
  'nora@demo.mayla': {
    relationshipGoal: 'RELATIONSHIP',
    nationality: 'SA',
    languages: ['Arabic', 'English'],
    lifestyle: ['Coffee Addict', 'Social Butterfly'],
    industry: 'Tech',
    education: "Bachelor's",
    personalityPrompts: [{ prompt: 'After work you\'ll find me...', answer: 'Exploring a new cafe.' }],
  },
  'faisal@demo.mayla': {
    relationshipGoal: 'LIFE_PARTNER',
    nationality: 'SA',
    languages: ['Arabic', 'English'],
    lifestyle: ['Travel', 'Adventurer'],
    industry: 'Real Estate',
    education: "Master's",
    personalityPrompts: [{ prompt: 'A perfect first date for me is...', answer: 'Architecture walk in Al Balad.' }],
  },
  'hana@demo.mayla': {
    relationshipGoal: 'SOCIAL_FUN',
    nationality: 'SA',
    languages: ['Arabic', 'English'],
    lifestyle: ['Adventurer', 'Foodie'],
    industry: 'Healthcare',
    education: "Master's",
    personalityPrompts: [{ prompt: 'Two truths and a lie...', answer: 'I love road trips, hate traffic, never get lost.' }],
  },
  'zain@demo.mayla': {
    relationshipGoal: 'COMPANIONSHIP',
    nationality: 'BH',
    languages: ['Arabic', 'English'],
    lifestyle: ['Luxury Lifestyle', 'Travel', 'Fine Dining'],
    industry: 'Finance',
    education: "Bachelor's",
    personalityPrompts: [{ prompt: 'The best travel story I have is...', answer: 'Surfing in Bahrain at sunrise.' }],
  },
  'mariam@demo.mayla': {
    relationshipGoal: 'RELATIONSHIP',
    nationality: 'BH',
    languages: ['Arabic', 'English'],
    lifestyle: ['Fitness Lover', 'Homebody'],
    industry: 'Healthcare',
    education: "Bachelor's",
    personalityPrompts: [{ prompt: 'A life goal I\'m working towards...', answer: 'Finishing med school with sanity intact.' }],
  },
  'khalid@demo.mayla': {
    relationshipGoal: 'CASUAL_DATING',
    nationality: 'KW',
    languages: ['Arabic', 'English'],
    lifestyle: ['Travel', 'Adventurer'],
    industry: 'Aviation',
    education: "Bachelor's",
    personalityPrompts: [{ prompt: 'The best travel story I have is...', answer: 'Landing in 40 countries and counting.' }],
  },
  'dana@demo.mayla': {
    relationshipGoal: 'COMPANIONSHIP',
    nationality: 'KW',
    languages: ['Arabic', 'English', 'French'],
    lifestyle: ['Luxury Lifestyle', 'Fine Dining', 'Travel'],
    industry: 'Retail',
    education: "Bachelor's",
    personalityPrompts: [{ prompt: 'My ideal Friday looks like...', answer: 'Brunch, boutique hopping, rooftop sunset.' }],
  },
  'yusuf@demo.mayla': {
    relationshipGoal: 'RELATIONSHIP',
    nationality: 'OM',
    languages: ['Arabic', 'English'],
    lifestyle: ['Adventurer', 'Beach Lover'],
    industry: 'Education',
    education: "Master's",
    personalityPrompts: [{ prompt: 'I geek out about...', answer: 'Coral reefs and marine life.' }],
  },
  'amira@demo.mayla': {
    relationshipGoal: 'MARRIAGE',
    nationality: 'OM',
    languages: ['Arabic', 'English'],
    lifestyle: ['Homebody', 'Bookworm'],
    industry: 'Education',
    education: "Bachelor's",
    personalityPrompts: [{ prompt: 'My most controversial opinion is...', answer: 'Pottery is better than therapy.' }],
  },
  'rashid@demo.mayla': {
    relationshipGoal: 'SOCIAL_FUN',
    nationality: 'QA',
    languages: ['Arabic', 'English'],
    lifestyle: ['Social Butterfly', 'Coffee Addict'],
    industry: 'Media',
    education: "Bachelor's",
    personalityPrompts: [{ prompt: 'I geek out about...', answer: 'Football stats and tactical analysis.' }],
  },
};

const DEFAULT_ENRICHMENT = {
  relationshipGoal: 'RELATIONSHIP' as const,
  nationality: 'AE',
  languages: ['Arabic', 'English'],
  lifestyle: ['Social Butterfly'],
  industry: 'Other',
  education: "Bachelor's",
  jobTitle: 'Professional',
  smoking: 'Never',
  drinking: 'Socially',
  exercise: 'Sometimes',
  height: 170,
  personalityPrompts: [] as { prompt: string; answer: string }[],
};

const SEED_LIFESTYLE: Record<string, { jobTitle: string; smoking: string; drinking: string; exercise: string; height: number }> = {
  'sara@demo.mayla': { jobTitle: 'Interior Designer', smoking: 'Never', drinking: 'Socially', exercise: 'Often', height: 165 },
  'omar@demo.mayla': { jobTitle: 'Software Engineer', smoking: 'Never', drinking: 'Socially', exercise: 'Daily', height: 178 },
  'ahmed@demo.mayla': { jobTitle: 'Executive Chef', smoking: 'Socially', drinking: 'Regularly', exercise: 'Sometimes', height: 182 },
  'fatima@demo.mayla': { jobTitle: 'Pharmacist', smoking: 'Never', drinking: 'Never', exercise: 'Often', height: 162 },
  'nora@demo.mayla': { jobTitle: 'Marketing Lead', smoking: 'Never', drinking: 'Socially', exercise: 'Daily', height: 168 },
  'faisal@demo.mayla': { jobTitle: 'Architect', smoking: 'Never', drinking: 'Never', exercise: 'Often', height: 175 },
  'dana@demo.mayla': { jobTitle: 'Fashion Buyer', smoking: 'Never', drinking: 'Socially', exercise: 'Daily', height: 170 },
};

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
  const hasPostgis = await ensurePostgis();
  if (!hasPostgis) {
    console.warn(
      'PostGIS extension not available — seeding latitude/longitude only. Use postgis/postgis Docker for full geo features.',
    );
  }

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
  await syncLocation(adminProfile.id, 25.2048, 55.2708, hasPostgis);

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

    const enrichment = PROFILE_ENRICHMENTS[demo.email] ?? DEFAULT_ENRICHMENT;
    const lifestyle = SEED_LIFESTYLE[demo.email] ?? {
      jobTitle: enrichment.industry === 'Student' ? 'Student' : `${enrichment.industry} Professional`,
      smoking: DEFAULT_ENRICHMENT.smoking,
      drinking: DEFAULT_ENRICHMENT.drinking,
      exercise: DEFAULT_ENRICHMENT.exercise,
      height: DEFAULT_ENRICHMENT.height,
    };

    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        displayName: demo.name,
        bio: demo.bio,
        gender: demo.gender,
        birthDate: demo.birthDate,
        city: demo.city,
        interests: demo.interests,
        nationality: enrichment.nationality,
        languages: enrichment.languages,
        lifestyle: enrichment.lifestyle,
        industry: enrichment.industry,
        education: enrichment.education,
        jobTitle: lifestyle.jobTitle,
        smoking: lifestyle.smoking,
        drinking: lifestyle.drinking,
        exercise: lifestyle.exercise,
        height: lifestyle.height,
        relationshipGoal: enrichment.relationshipGoal,
        personalityPrompts: enrichment.personalityPrompts,
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
        nationality: enrichment.nationality,
        languages: enrichment.languages,
        lifestyle: enrichment.lifestyle,
        industry: enrichment.industry,
        education: enrichment.education,
        jobTitle: lifestyle.jobTitle,
        smoking: lifestyle.smoking,
        drinking: lifestyle.drinking,
        exercise: lifestyle.exercise,
        height: lifestyle.height,
        relationshipGoal: enrichment.relationshipGoal,
        personalityPrompts: enrichment.personalityPrompts,
      },
    });
    await syncLocation(profile.id, demo.lat, demo.lng, hasPostgis);

    await prisma.userPreference.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        genderPref: demo.gender === 'MALE' ? ['FEMALE'] : ['MALE'],
        ageMin: 22,
        ageMax: 42,
        maxDistanceKm: 100,
        relationshipGoals: demo.tier !== 'FREE' ? [enrichment.relationshipGoal] : [],
        languages: enrichment.languages.slice(0, 1),
      },
      update: {
        genderPref: demo.gender === 'MALE' ? ['FEMALE'] : ['MALE'],
        relationshipGoals: demo.tier !== 'FREE' ? [enrichment.relationshipGoal] : [],
      },
    });

    await prisma.subscription.upsert({
      where: { userId: user.id },
      create: { userId: user.id, tier: demo.tier, status: 'ACTIVE' },
      update: { tier: demo.tier, status: 'ACTIVE' },
    });

    count++;
  }

  console.log(`Seeded 1 admin + ${count} demo users across 6 countries`);

  const events = [
    { title: 'Ladies Brunch Dubai', description: 'Social brunch for expat women', city: 'Dubai', country: 'AE', category: 'Brunch', startsAt: new Date(Date.now() + 3 * 86400000), maxAttendees: 30 },
    { title: 'Beach Meetup Manama', description: 'Sunset beach walk and coffee', city: 'Manama', country: 'BH', category: 'Beach', startsAt: new Date(Date.now() + 5 * 86400000), maxAttendees: 40 },
    { title: 'Rooftop Social Doha', description: 'Evening mixer with verified members', city: 'Doha', country: 'QA', category: 'Social', startsAt: new Date(Date.now() + 7 * 86400000), maxAttendees: 50 },
  ];
  for (const e of events) {
    await prisma.communityEvent.create({ data: e });
  }
  console.log(`Seeded ${events.length} community events`);

  console.log('Password for all: admin123!');
  console.log('OTP for all: 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
