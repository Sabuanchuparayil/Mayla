export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureRedisConnected } from '@/lib/redis';
import { isMongoDBAvailable } from '@/lib/mongodb';

export async function GET() {
  const checks: Record<string, { status: 'ok' | 'error'; latencyMs?: number; message?: string }> =
    {};

  const dbStart = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = { status: 'ok', latencyMs: Date.now() - dbStart };
  } catch (error) {
    checks.database = {
      status: 'error',
      latencyMs: Date.now() - dbStart,
      message: error instanceof Error ? error.message : 'Database unavailable',
    };
  }

  const redisStart = Date.now();
  try {
    const redis = await ensureRedisConnected();
    const pong = await redis.ping();
    checks.redis = {
      status: pong === 'PONG' ? 'ok' : 'error',
      latencyMs: Date.now() - redisStart,
    };
  } catch (error) {
    checks.redis = {
      status: 'error',
      latencyMs: Date.now() - redisStart,
      message: error instanceof Error ? error.message : 'Redis unavailable',
    };
  }

  const mongoStart = Date.now();
  try {
    const available = await isMongoDBAvailable();
    checks.mongodb = {
      status: available ? 'ok' : 'error',
      latencyMs: Date.now() - mongoStart,
      ...(available ? {} : { message: 'MongoDB unavailable' }),
    };
  } catch (error) {
    checks.mongodb = {
      status: 'error',
      latencyMs: Date.now() - mongoStart,
      message: error instanceof Error ? error.message : 'MongoDB unavailable',
    };
  }

  const healthy = Object.values(checks).every((c) => c.status === 'ok');

  return NextResponse.json(
    {
      success: healthy,
      data: {
        status: healthy ? 'healthy' : 'degraded',
        version: process.env.npm_package_version ?? '0.1.0',
        timestamp: new Date().toISOString(),
        checks,
      },
    },
    { status: healthy ? 200 : 503 },
  );
}
