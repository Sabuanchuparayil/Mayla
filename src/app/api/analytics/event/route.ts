import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Collection endpoint for client analytics events. Currently logs a structured
// line; swap the console.log for a real sink (PostHog, warehouse, etc.).
export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.event !== 'string') {
    return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
  }

  const userId = req.headers.get('x-user-id') ?? null;
  console.log(
    '[analytics]',
    JSON.stringify({
      event: body.event,
      userId,
      props: body.props ?? {},
      ts: body.ts ?? Date.now(),
    }),
  );

  return NextResponse.json({ ok: true });
}
