import {
  CompareFacesCommand,
  type CompareFacesCommandOutput,
} from '@aws-sdk/client-rekognition';
import { rekognitionClient } from '@/lib/s3';

function isMockMode(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return process.env.MOCK_VERIFICATION === 'true';
  }
  return process.env.MOCK_VERIFICATION !== 'false';
}

export type VerificationResult = {
  verified: boolean;
  confidence: number;
  mock: boolean;
};

export async function verifySelfie(sourceImageKey: string, targetImageKey?: string): Promise<VerificationResult> {
  if (isMockMode()) {
    return { verified: true, confidence: 99.9, mock: true };
  }

  const command = new CompareFacesCommand({
    SourceImage: { S3Object: { Bucket: process.env.AWS_S3_BUCKET ?? '', Name: sourceImageKey } },
    TargetImage: { S3Object: { Bucket: process.env.AWS_S3_BUCKET ?? '', Name: targetImageKey ?? sourceImageKey } },
    SimilarityThreshold: 90,
  });

  const result: CompareFacesCommandOutput = await rekognitionClient.send(command);
  const match = result.FaceMatches?.[0];
  const confidence = match?.Similarity ?? 0;

  return {
    verified: confidence >= 90,
    confidence,
    mock: false,
  };
}
