import { S3Client } from '@aws-sdk/client-s3';
import { RekognitionClient } from '@aws-sdk/client-rekognition';

const region = process.env.AWS_REGION ?? 'me-south-1'; // AWS Bahrain

const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
};

export const s3Client = new S3Client({ region, credentials });
export const rekognitionClient = new RekognitionClient({ region, credentials });
export const S3_BUCKET = process.env.AWS_S3_BUCKET ?? '';
