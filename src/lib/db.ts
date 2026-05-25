import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

type PrismaGlobal = { db?: PrismaClient; pgPool?: Pool };
const g = globalThis as unknown as PrismaGlobal;

function createPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    min: 2,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
}

function createClient(): PrismaClient {
  g.pgPool ??= createPool();
  const adapter = new PrismaPg(g.pgPool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  } as ConstructorParameters<typeof PrismaClient>[0]);
}

export const db = g.db ?? createClient();

if (process.env.NODE_ENV !== 'production') g.db = db;
