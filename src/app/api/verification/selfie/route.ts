import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET } from '@/lib/s3';
import { db } from '@/lib/db';
import { VerificationStatus } from '@/generated/prisma/enums';
import { selfieQueue } from '@/lib/queues';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const image = formData.get('image') as File | null;
    const lat = formData.get('lat');
    const lng = formData.get('lng');

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    const uuid = randomUUID();
    const key = `selfies/${userId}/${uuid}.jpg`;

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
    const selfieUrl = `https://${S3_BUCKET}.s3.${region}.amazonaws.com/${key}`;

    const isMock = process.env.MOCK_VERIFICATION === 'true';

    // Check if a verification record already exists for this user
    const existing = await db.verification.findFirst({ where: { userId } });

    let verification;
    if (existing) {
      verification = await db.verification.update({
        where: { id: existing.id },
        data: {
          selfieUrl,
          selfieStorageKey: key,
          status: isMock ? VerificationStatus.APPROVED : VerificationStatus.PENDING,
          embedding: isMock ? { set: Array(128).fill(0.1) } : { set: [] },
          verifiedAt: isMock ? new Date() : null,
        },
      });
    } else {
      verification = await db.verification.create({
        data: {
          userId,
          selfieUrl,
          selfieStorageKey: key,
          status: isMock ? VerificationStatus.APPROVED : VerificationStatus.PENDING,
          embedding: isMock ? { set: Array(128).fill(0.1) } : undefined,
          verifiedAt: isMock ? new Date() : null,
        },
      });
    }

    if (!isMock) {
      await selfieQueue.add('verify-selfie', {
        userId,
        selfieUrl,
        lat: lat ? parseFloat(lat as string) : 0,
        lng: lng ? parseFloat(lng as string) : 0,
      });
    }

    // Store lat/lng on profile if provided
    if (lat && lng) {
      const latNum = parseFloat(lat as string);
      const lngNum = parseFloat(lng as string);
      if (!isNaN(latNum) && !isNaN(lngNum)) {
        await db.profile.updateMany({
          where: { userId },
          data: { latitude: latNum, longitude: lngNum },
        });
      }
    }

    return NextResponse.json({
      verificationId: verification.id,
      status: verification.status,
    });
  } catch (err) {
    console.error('Selfie upload error', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
