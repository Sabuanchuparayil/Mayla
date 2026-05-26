-- Per-photo blur controls (Gold+ feature)
ALTER TABLE "profiles" ADD COLUMN "blurredPhotoIndices" JSONB NOT NULL DEFAULT '[]';
