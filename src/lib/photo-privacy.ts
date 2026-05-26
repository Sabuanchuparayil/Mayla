/** Index 0 stays visible for verification and Discover main image. */
export const MAIN_PHOTO_INDEX = 0;

export function parseBlurredPhotoIndices(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((v): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0))];
}

export function resolveBlurredPhotoIndices(
  photoCount: number,
  blurredPhotoIndices: unknown,
  photoBlurUntilMatch: boolean,
): number[] {
  const explicit = parseBlurredPhotoIndices(blurredPhotoIndices).filter(
    (i) => i > MAIN_PHOTO_INDEX && i < photoCount,
  );

  if (explicit.length > 0) return explicit;

  if (photoBlurUntilMatch && photoCount > 1) {
    return Array.from({ length: photoCount - 1 }, (_, i) => i + 1);
  }

  return [];
}

export function sanitizeBlurredPhotoIndices(indices: number[], photoCount: number): number[] {
  return [...new Set(indices.filter((i) => i > MAIN_PHOTO_INDEX && i < photoCount))].sort((a, b) => a - b);
}

export function isPhotoBlurred(
  index: number,
  blurredIndices: number[],
  isMatched: boolean,
): boolean {
  if (isMatched) return false;
  return blurredIndices.includes(index);
}

export function countLockedPhotos(blurredIndices: number[], photoCount: number): number {
  return blurredIndices.filter((i) => i > MAIN_PHOTO_INDEX && i < photoCount).length;
}

/** Re-map blur indices after a photo is removed. */
export function remapBlurredIndicesAfterRemoval(indices: number[], removedIndex: number): number[] {
  return indices
    .filter((i) => i !== removedIndex)
    .map((i) => (i > removedIndex ? i - 1 : i));
}

/** Re-map blur indices after moving a photo from `from` to `to`. */
export function remapBlurredIndicesAfterReorder(
  indices: number[],
  from: number,
  to: number,
  photoCount: number,
): number[] {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= photoCount ||
    to >= photoCount ||
    photoCount === 0
  ) {
    return sanitizeBlurredPhotoIndices(indices, photoCount);
  }

  const order = Array.from({ length: photoCount }, (_, i) => i);
  const removed = order.splice(from, 1);
  const moved = removed[0];
  if (moved === undefined) {
    return sanitizeBlurredPhotoIndices(indices, photoCount);
  }
  order.splice(to, 0, moved);

  const oldIndexToNew = new Array<number>(photoCount);
  for (let newIdx = 0; newIdx < photoCount; newIdx++) {
    const oldIdx = order[newIdx];
    if (oldIdx !== undefined) oldIndexToNew[oldIdx] = newIdx;
  }

  return sanitizeBlurredPhotoIndices(
    indices.map((oldIdx) => oldIndexToNew[oldIdx] ?? oldIdx),
    photoCount,
  );
}
