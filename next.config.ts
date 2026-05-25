import type { NextConfig } from "next";

const s3Hostname = process.env.AWS_S3_BUCKET
  ? `${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION ?? 'us-east-1'}.amazonaws.com`
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // S3 bucket for user photos
      ...(s3Hostname
        ? [{ protocol: 'https' as const, hostname: s3Hostname }]
        : []),
      // S3 path-style (for local dev with custom endpoint)
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
      },
    ],
  },
};

export default nextConfig;
