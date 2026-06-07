import prisma from '../../config/db.js';
import env from '../../config/env.js';

// Euclidean distance between two equal-length numeric vectors.
export function euclideanDistance(a, b) {
  if (!a || !b || a.length !== b.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

/**
 * Local facial-recognition driver.
 *
 * Face descriptors (128-d embeddings) are computed on the client with
 * face-api.js and stored with each photo. Matching is a nearest-neighbour
 * search done here in plain JS.
 *
 * Scalability note: for large datasets swap this DB scan for a pgvector
 * similarity query or AWS Rekognition (see ./rekognition.js) — the controller
 * only depends on `matchFaces`.
 */
export const localAI = {
  driver: 'local',

  async matchFaces(referenceDescriptor, { threshold = env.faceMatchThreshold } = {}) {
    if (!referenceDescriptor?.length) return [];

    const faces = await prisma.faceDescriptor.findMany({
      select: { mediaId: true, descriptor: true },
    });

    // Keep the best (smallest) distance per media item.
    const best = new Map();
    for (const face of faces) {
      const dist = euclideanDistance(referenceDescriptor, face.descriptor);
      if (dist <= threshold) {
        const prev = best.get(face.mediaId);
        if (prev === undefined || dist < prev) best.set(face.mediaId, dist);
      }
    }

    return [...best.entries()]
      .sort((a, b) => a[1] - b[1])
      .map(([mediaId, distance]) => ({ mediaId, distance }));
  },
};
