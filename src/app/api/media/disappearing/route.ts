import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, S3_BUCKET } from '@/lib/s3';
import { connectMongoDB } from '@/lib/mongodb';
import { DisappearingMedia } from '@/models/disappearing-media.model';
import { db } from '@/lib/db';
import { DetectModerationLabelsCommand } from '@aws-sdk/client-rekognition';
import { rekognitionClient } from '@/lib/s3';

const PRESIGN_TTL = 15 * 60; // 15 minutes
const NSFW_THRESHOLD = 80;
const NSFW_LABELS = new Set(['Explicit Nudity', 'Violence', 'Visually Disturbing', 'Nudity']);

async function assertMatchMember(userId: string, matchId: string): Promise<{ user1Id: string; user2Id: string } | null> {
  return db.match.findFirst({
    where: {
      id: matchId,
      OR: [{ user1Id: userId }, { user2Id: userId }],
      status: 'ACTIVE',
    },
    select: { user1Id: true, user2Id: true },
  });
}

// POST /api/media/disappearing
// Body: multipart/form-data — image (File), matchId (string)
export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });

  const image = formData.get('image') as File | null;
  const matchId = formData.get('matchId') as string | null;

  if (!image || !matchId) {
    return NextResponse.json({ error: 'image and matchId are required' }, { status: 400 });
  }

  const match = await assertMatchMember(userId, matchId);
  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });

  const receiverId = match.user1Id === userId ? match.user2Id : match.user1Id;

  // Upload to S3
  const key = `disappearing/${userId}/${crypto.randomUUID()}.jpg`;
  const buffer = Buffer.from(await image.arrayBuffer());

  await s3Client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: image.type || 'image/jpeg',
      CacheControl: 'no-store',
    }),
  );

  // NSFW check (skip if mock mode)
  if (process.env.MOCK_VERIFICATION !== 'true') {
    try {
      const modResult = await rekognitionClient.send(
        new DetectModerationLabelsCommand({
          Image: { S3Object: { Bucket: S3_BUCKET, Name: key } },
          MinConfidence: NSFW_THRESHOLD,
        }),
      );
      const hasNsfw = (modResult.ModerationLabels ?? []).some(
        (l) => l.Name && NSFW_LABELS.has(l.Name) && (l.Confidence ?? 0) >= NSFW_THRESHOLD,
      );
      if (hasNsfw) {
        return NextResponse.json({ error: 'Content violates community guidelines.' }, { status: 422 });
      }
    } catch {
      // If Rekognition fails, allow the upload (fail open for media)
    }
  }

  const expiresAt = new Date(Date.now() + PRESIGN_TTL * 1000);

  await connectMongoDB();
  const media = await DisappearingMedia.create({
    matchId,
    senderId: userId,
    receiverId,
    s3Key: key,
    expiresAt,
  });

  // Generate 15-min presigned GET URL — never use PutObjectCommand here
  const presignedUrl = await getSignedUrl(
    s3Client,
    new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }),
    { expiresIn: PRESIGN_TTL },
  );

  return NextResponse.json(
    {
      mediaId: (media._id as object).toString(),
      presignedUrl,
      expiresAt,
    },
    {
      status: 201,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
