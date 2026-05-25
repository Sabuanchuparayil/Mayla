import {
  CompareFacesCommand,
  type CompareFacesCommandOutput,
} from '@aws-sdk/client-rekognition';
import { rekognitionClient } from '@/lib/s3';

const MOCK = process.env.MOCK_VERIFICATION !== 'false';

export type VerificationResult = {
  verified: boolean;
  confidence: number;
  mock: boolean;
};

/** Face verification — returns mock pass when MOCK_VERIFICATION=true (default in dev). */
export async function verifySelfie(_sourceImageKey: string, _targetImageKey?: string): Promise<VerificationResult> {
  if (MOCK) {
    return { verified: true, confidence: 99.9, mock: true };
  }

  // Real Rekognition integration — wire S3 object keys when MOCK_VERIFICATION=false
  const command = new CompareFacesCommand({
    SourceImage: { S3Object: { Bucket: process.env.AWS_S3_BUCKET ?? '', Name: _sourceImageKey } },
    TargetImage: { S3Object: { Bucket: process.env.AWS_S3_BUCKET ?? '', Name: _targetImageKey ?? _sourceImageKey } },
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
