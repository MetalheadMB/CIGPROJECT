// Facial recognition (descriptor extraction) using face-api.js in the browser.
import * as faceapi from '@vladmandic/face-api';

const MODEL_URL =
  import.meta.env.VITE_FACE_MODELS_URL ||
  'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model';

let loadPromise = null;

export function loadFaceModels() {
  if (!loadPromise) {
    loadPromise = Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]).catch((e) => {
      loadPromise = null; // allow retry
      throw e;
    });
  }
  return loadPromise;
}

/**
 * Detect all faces in an image element and return their 128-d descriptors.
 * Returns [{ descriptor: number[], box: {x,y,width,height} }].
 */
export async function extractFaces(imgEl) {
  await loadFaceModels();
  const results = await faceapi
    .detectAllFaces(imgEl)
    .withFaceLandmarks()
    .withFaceDescriptors();

  return results.map((r) => ({
    descriptor: Array.from(r.descriptor),
    box: {
      x: Math.round(r.detection.box.x),
      y: Math.round(r.detection.box.y),
      width: Math.round(r.detection.box.width),
      height: Math.round(r.detection.box.height),
    },
  }));
}

/**
 * Extract a single primary face descriptor (for a reference selfie).
 * Returns number[] or null if no face found.
 */
export async function extractPrimaryDescriptor(imgEl) {
  await loadFaceModels();
  const result = await faceapi
    .detectSingleFace(imgEl)
    .withFaceLandmarks()
    .withFaceDescriptor();
  return result ? Array.from(result.descriptor) : null;
}
