// ts-node src/workers/photo.worker.ts
import { Worker, Job } from 'bullmq';
import {
  CompareFacesCommand,
  DetectModerationLabelsCommand,
} from '@aws-sdk/client-rekognition';
import { rekognitionClient, S3_BUCKET } from '@/lib/s3';
import { db } from '@/lib/db';
import { redis } from '@/lib/redis';

interface PhotoJobData {
  photoId: string;
  userId: string;
  photoUrl: string;
  selfieUrl: string;
}

const BLOCKED_LABELS = ['Explicit Nudity', 'Violence', 'Visually Disturbing'];

const connection = { ...redis.options };

function extractKeyFromUrl(url: string): string {
  // URL format: https://{bucket}.s3.{region}.amazonaws.com/{key}
  const urlObj = new URL(url);
  return urlObj.pathname.slice(1);
}

const worker = new Worker<PhotoJobData>(
  'photo-matching',
  async (job: Job<PhotoJobData>) => {
    const { photoId, userId, photoUrl, selfieUrl } = job.data;

    console.log(`[photo-worker] Processing job ${job.id} for photo ${photoId}`);

    const photoKey = extractKeyFromUrl(photoUrl);
    const selfieKey = extractKeyFromUrl(selfieUrl);

    // Run face comparison and moderation check in parallel
    const [compareFacesResult, moderationResult] = await Promise.all([
      rekognitionClient.send(
        new CompareFacesCommand({
          SourceImage: {
            S3Object: { Bucket: S3_BUCKET, Name: selfieKey },
          },
          TargetImage: {
            S3Object: { Bucket: S3_BUCKET, Name: photoKey },
          },
          SimilarityThreshold: 0,
        }),
      ),
      rekognitionClient.send(
        new DetectModerationLabelsCommand({
          Image: {
            S3Object: { Bucket: S3_BUCKET, Name: photoKey },
          },
          MinConfidence: 50,
        }),
      ),
    ]);

    // Check moderation labels
    const moderationLabels = moderationResult.ModerationLabels ?? [];
    const blockedLabel = moderationLabels.find(
      (label) =>
        label.Confidence !== undefined &&
        label.Confidence >= 80 &&
        label.Name !== undefined &&
        BLOCKED_LABELS.includes(label.Name),
    );

    if (blockedLabel) {
      console.log(
        `[photo-worker] Rejecting photo ${photoId}: moderation label "${blockedLabel.Name}" (${blockedLabel.Confidence?.toFixed(1)}%)`,
      );

      await db.photo.update({
        where: { id: photoId },
        data: { isVerified: false },
      });
      return;
    }

    // Get face match similarity
    const faceMatches = compareFacesResult.FaceMatches ?? [];
    const topMatch = faceMatches[0];
    const similarity = topMatch?.Similarity ?? 0;

    console.log(
      `[photo-worker] Photo ${photoId} face similarity: ${similarity.toFixed(1)}% for user ${userId}`,
    );

    if (similarity >= 60) {
      // High confidence match — approve
      await db.photo.update({
        where: { id: photoId },
        data: { isVerified: true },
      });
      console.log(`[photo-worker] Approved photo ${photoId}`);
    } else if (similarity >= 40) {
      // Medium match — flag for manual review
      console.log(
        `[photo-worker] Manual review needed for photo ${photoId} (similarity=${similarity.toFixed(1)}%, userId=${userId})`,
      );
      await db.photo.update({
        where: { id: photoId },
        data: { isVerified: false },
      });
    } else {
      // Low match — reject
      console.log(`[photo-worker] Rejected photo ${photoId} (similarity=${similarity.toFixed(1)}%)`);
      await db.photo.update({
        where: { id: photoId },
        data: { isVerified: false },
      });
    }
  },
  { connection },
);

worker.on('completed', (job) => {
  console.log(`[photo-worker] Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`[photo-worker] Job ${job?.id} failed:`, err);
});

console.log('[photo-worker] Worker started, waiting for jobs...');
