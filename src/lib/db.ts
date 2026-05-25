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

function getClient(): PrismaClient {
  g.db ??= createClient();
  return g.db;
}

// Proxy so the PrismaClient (and its pg pool) is only constructed on first
// real property access. This keeps `next build` from opening a DB connection
// at import time when it statically analyses route modules.
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === 'function' ? value.bind(client) : value;
  },
}) as PrismaClient;
