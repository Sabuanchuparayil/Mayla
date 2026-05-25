import { S3Client } from '@aws-sdk/client-s3';
import { RekognitionClient } from '@aws-sdk/client-rekognition';

const region = process.env.AWS_REGION ?? 'me-south-1';

function awsConfig() {
  return {
    region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
    },
  };
}

let s3: S3Client | undefined;
let rekognition: RekognitionClient | undefined;

export function getS3Client(): S3Client {
  if (!s3) s3 = new S3Client(awsConfig());
  return s3;
}

export function getRekognitionClient(): RekognitionClient {
  if (!rekognition) rekognition = new RekognitionClient(awsConfig());
  return rekognition;
}

export const s3Client = new Proxy({} as S3Client, {
  get(_t, prop) {
    const client = getS3Client();
    const value = client[prop as keyof S3Client];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export const rekognitionClient = new Proxy({} as RekognitionClient, {
  get(_t, prop) {
    const client = getRekognitionClient();
    const value = client[prop as keyof RekognitionClient];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export const S3_BUCKET = process.env.AWS_S3_BUCKET ?? '';
