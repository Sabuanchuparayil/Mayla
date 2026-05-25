import { NextRequest, NextResponse } from 'next/server';
import { DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, S3_BUCKET } from '@/lib/s3';
import { connectMongoDB } from '@/lib/mongodb';
import { DisappearingMedia } from '@/models/disappearing-media.model';

const VIEW_PRESIGN_TTL = 60; // 1 minute to view after marking

// GET /api/media/disappearing/:id/viewed — get presigned view URL
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await connectMongoDB();

  const media = await DisappearingMedia.findById(id);
  if (!media) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (media.receiverId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (media.viewedAt) return NextResponse.json({ error: 'Already viewed' }, { status: 410 });
  if (media.expiresAt < new Date()) return NextResponse.json({ error: 'Expired' }, { status: 410 });

  const viewUrl = await getSignedUrl(
    s3Client,
    new GetObjectCommand({ Bucket: S3_BUCKET, Key: media.s3Key }),
    { expiresIn: VIEW_PRESIGN_TTL },
  );

  return NextResponse.json(
    { viewUrl },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

// PUT /api/media/disappearing/:id/viewed — mark viewed + delete from S3
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await connectMongoDB();

  const media = await DisappearingMedia.findById(id);
  if (!media) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (media.receiverId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (media.viewedAt) return NextResponse.json({ error: 'Already viewed' }, { status: 410 });

  // Mark viewed
  media.viewedAt = new Date();
  await media.save();

  // Delete from S3 (fire-and-forget, don't block response)
  s3Client.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: media.s3Key })).catch(() => {});

  return NextResponse.json(
    { viewed: true, viewedAt: media.viewedAt },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
