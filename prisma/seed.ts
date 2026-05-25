import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

const prompts = [
  // About Me
  { question: 'My love language is...', category: 'About Me', order: 1 },
  { question: 'The way to my heart is...', category: 'About Me', order: 2 },
  { question: 'My friends would describe me as...', category: 'About Me', order: 3 },
  { question: "I'm most proud of...", category: 'About Me', order: 4 },
  { question: 'A random fact about me...', category: 'About Me', order: 5 },

  // Lifestyle
  { question: 'My perfect Sunday looks like...', category: 'Lifestyle', order: 6 },
  { question: "On a typical Friday night I'm...", category: 'Lifestyle', order: 7 },
  { question: 'My simple pleasures are...', category: 'Lifestyle', order: 8 },
  { question: "I'm weirdly passionate about...", category: 'Lifestyle', order: 9 },
  { question: 'My go-to comfort food is...', category: 'Lifestyle', order: 10 },

  // Icebreakers
  { question: 'Two truths and a lie...', category: 'Icebreaker', order: 11 },
  { question: 'My most controversial opinion is...', category: 'Icebreaker', order: 12 },
  { question: "The most spontaneous thing I've done is...", category: 'Icebreaker', order: 13 },
  { question: 'I get way too excited about...', category: 'Icebreaker', order: 14 },
  { question: 'Teach me something about...', category: 'Icebreaker', order: 15 },

  // Values
  { question: 'The first thing I notice about someone is...', category: 'Values', order: 16 },
  { question: 'My biggest green flag is...', category: 'Values', order: 17 },
  { question: "I'm convinced that...", category: 'Values', order: 18 },

  // Looking For
  { question: "I'm looking for someone who...", category: 'Looking For', order: 19 },
  { question: "We'll get along if...", category: 'Looking For', order: 20 },
];

async function main() {
  console.warn('Seeding prompts...');
  for (const p of prompts) {
    await prisma.prompt.upsert({
      where: { id: `prompt_${p.order}` },
      update: { question: p.question, category: p.category, order: p.order },
      create: { id: `prompt_${p.order}`, question: p.question, category: p.category, order: p.order },
    });
  }
  console.warn(`Seeded ${prompts.length} prompts.`);

  console.warn('Seeding admin user...');
  const hashedPassword = await bcrypt.hash('admin123!', 12);
  await prisma.user.upsert({
    where: { email: 'admin@mayla.app' },
    update: {},
    create: {
      email: 'admin@mayla.app',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      emailVerifiedAt: new Date(),
    },
  });
  console.warn('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
