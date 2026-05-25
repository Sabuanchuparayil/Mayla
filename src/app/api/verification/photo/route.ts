import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET } from '@/lib/s3';
import { db } from '@/lib/db';
import { VerificationStatus } from '@/generated/prisma/enums';
import { photoQueue } from '@/lib/queues';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const image = formData.get('image') as File | null;
    const orderStr = formData.get('order');

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    // Check selfie verification status
    const verification = await db.verification.findFirst({ where: { userId } });
    if (!verification || verification.status !== VerificationStatus.APPROVED) {
      return NextResponse.json(
        { error: 'Complete selfie verification first' },
        { status: 400 },
      );
    }

    const order = orderStr ? parseInt(orderStr as string, 10) : 0;

    const uuid = randomUUID();
    const key = `photos/${userId}/${uuid}.jpg`;

    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await s3Client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: 'image/jpeg',
      }),
    );

    const region = process.env.AWS_REGION ?? 'me-south-1';
    const url = `https://${S3_BUCKET}.s3.${region}.amazonaws.com/${key}`;

    const isMock = process.env.MOCK_VERIFICATION === 'true';

    const photo = await db.photo.create({
      data: {
        userId,
        url,
        storageKey: key,
        order,
        isVerified: isMock,
        isMain: order === 0,
      },
    });

    if (!isMock) {
      await photoQueue.add('match-photo', {
        photoId: photo.id,
        userId,
        photoUrl: url,
        selfieUrl: verification.selfieUrl ?? '',
      });
    }

    return NextResponse.json({
      photoId: photo.id,
      status: isMock ? 'approved' : 'pending',
    });
  } catch (err) {
    console.error('Photo upload error', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
