import { randomUUID } from 'crypto';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getS3Client, S3_BUCKET } from '@/lib/s3';

const CONTENT_TYPE_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
};

function extensionForContentType(contentType: string): string {
  return CONTENT_TYPE_EXT[contentType] ?? 'bin';
}

function useMockUpload(): boolean {
  if (process.env.MOCK_UPLOAD === 'true') return true;
  if (process.env.MOCK_UPLOAD === 'false') return false;
  return (
    process.env.NODE_ENV !== 'production' &&
    (!process.env.AWS_ACCESS_KEY_ID || !S3_BUCKET)
  );
}

export type PresignResult = {
  key: string;
  uploadUrl: string | null;
  mock: boolean;
  expiresIn: number;
};

export async function createUploadPresign(
  userId: string,
  contentType: string,
  folder: 'avatars' | 'photos' | 'selfies',
): Promise<PresignResult> {
  const ext = extensionForContentType(contentType);
  const key = `uploads/${userId}/${folder}/${randomUUID()}.${ext}`;
  const expiresIn = 3600;

  if (useMockUpload()) {
    return {
      key,
      uploadUrl: null,
      mock: true,
      expiresIn,
    };
  }

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(getS3Client(), command, { expiresIn });

  return {
    key,
    uploadUrl,
    mock: false,
    expiresIn,
  };
}
