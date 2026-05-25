import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { connectMongoDB } from '@/lib/mongodb';
import { Message } from '@/models/message.model';
import { filterText } from '@/lib/content-filter';
import { db } from '@/lib/db';

const LIMIT = 50;

async function assertMatchMember(userId: string, matchId: string): Promise<boolean> {
  const match = await db.match.findFirst({
    where: {
      id: matchId,
      OR: [{ user1Id: userId }, { user2Id: userId }],
      status: 'ACTIVE',
    },
    select: { id: true },
  });
  return !!match;
}

// GET /api/messages/:matchId?before=<iso>&limit=50
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> },
) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { matchId } = await params;

  const isMember = await assertMatchMember(userId, matchId);
  if (!isMember) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { searchParams } = req.nextUrl;
  const before = searchParams.get('before');
  const limit = Math.min(parseInt(searchParams.get('limit') ?? String(LIMIT), 10), 100);

  await connectMongoDB();

  const query: Record<string, unknown> = { matchId, deletedAt: null };
  if (before) query['createdAt'] = { $lt: new Date(before) };

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return NextResponse.json({ messages: messages.reverse() });
}

const sendSchema = z.object({
  content: z.string().min(1).max(1000),
  type: z.enum(['text', 'image']).optional().default('text'),
  mediaUrl: z.url().optional(),
});

// POST /api/messages/:matchId  — REST fallback for when WS is unavailable
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> },
) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { matchId } = await params;

  const isMember = await assertMatchMember(userId, matchId);
  if (!isMember) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 });
  }

  const { content, type, mediaUrl } = parsed.data;

  if (type === 'text') {
    const { clean } = filterText(content);
    if (!clean) {
      return NextResponse.json({ error: 'Message contains prohibited content.' }, { status: 422 });
    }
  }

  await connectMongoDB();
  const message = await Message.create({
    matchId,
    senderId: userId,
    content,
    type,
    mediaUrl: mediaUrl ?? null,
  });

  return NextResponse.json({ message }, { status: 201 });
}
