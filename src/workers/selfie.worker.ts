// ts-node src/workers/selfie.worker.ts
import { Worker, Job } from 'bullmq';
import { DetectFacesCommand } from '@aws-sdk/client-rekognition';
import { rekognitionClient, S3_BUCKET } from '@/lib/s3';
import { db } from '@/lib/db';
import { redis } from '@/lib/redis';
import { VerificationStatus } from '@/generated/prisma/enums';

interface SelfieJobData {
  userId: string;
  selfieUrl: string;
  lat: number;
  lng: number;
}

const connection = { ...redis.options };

function extractKeyFromUrl(url: string): string {
  // URL format: https://{bucket}.s3.{region}.amazonaws.com/{key}
  const urlObj = new URL(url);
  // pathname starts with '/', strip it
  return urlObj.pathname.slice(1);
}

function buildEmbedding(faceDetail: {
  Landmarks?: Array<{ X?: number; Y?: number }>;
}): number[] {
  const landmarks = faceDetail.Landmarks ?? [];
  const coords: number[] = [];

  for (const lm of landmarks.slice(0, 27)) {
    coords.push(lm.X ?? 0);
    coords.push(lm.Y ?? 0);
  }

  // Pad to 54 floats from landmarks
  while (coords.length < 54) {
    coords.push(0);
  }

  // Fill remaining to reach 128 dims with zeros
  while (coords.length < 128) {
    coords.push(0);
  }

  return coords.slice(0, 128);
}

const worker = new Worker<SelfieJobData>(
  'selfie-verification',
  async (job: Job<SelfieJobData>) => {
    const { userId, selfieUrl } = job.data;

    console.log(`[selfie-worker] Processing job ${job.id} for user ${userId}`);

    const key = extractKeyFromUrl(selfieUrl);

    const response = await rekognitionClient.send(
      new DetectFacesCommand({
        Image: {
          S3Object: {
            Bucket: S3_BUCKET,
            Name: key,
          },
        },
        Attributes: ['ALL'],
      }),
    );

    const faces = response.FaceDetails ?? [];

    // Find the existing verification record
    const existing = await db.verification.findFirst({ where: { userId } });
    if (!existing) {
      console.error(`[selfie-worker] No verification record found for user ${userId}`);
      return;
    }

    // Validate: exactly 1 face, confidence >= 90, brightness >= 40
    if (
      faces.length !== 1 ||
      (faces[0]?.Confidence ?? 0) < 90 ||
      (faces[0]?.Quality?.Brightness ?? 0) < 40
    ) {
      console.log(
        `[selfie-worker] Rejecting userId=${userId}: faces=${faces.length}, ` +
          `confidence=${faces[0]?.Confidence ?? 0}, brightness=${faces[0]?.Quality?.Brightness ?? 0}`,
      );

      await db.verification.update({
        where: { id: existing.id },
        data: {
          status: VerificationStatus.REJECTED,
          rejectedReason:
            faces.length !== 1
              ? `Expected 1 face, found ${faces.length}`
              : faces[0]?.Quality?.Brightness !== undefined &&
                  faces[0].Quality.Brightness < 40
                ? 'Image too dark'
                : 'Face confidence too low',
        },
      });
      return;
    }

    const faceDetail = faces[0]!;
    const embedding = buildEmbedding({
      Landmarks: faceDetail.Landmarks?.map((lm) => ({
        X: lm.X,
        Y: lm.Y,
      })),
    });

    await db.verification.update({
      where: { id: existing.id },
      data: {
        status: VerificationStatus.APPROVED,
        embedding: { set: embedding },
        verifiedAt: new Date(),
      },
    });

    console.log(`[selfie-worker] Approved userId=${userId}`);
  },
  { connection },
);

worker.on('completed', (job) => {
  console.log(`[selfie-worker] Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`[selfie-worker] Job ${job?.id} failed:`, err);
});

console.log('[selfie-worker] Worker started, waiting for jobs...');
