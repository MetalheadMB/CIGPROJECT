// Smart image tagging using TensorFlow.js MobileNet (runs entirely in the browser).
import '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

let modelPromise = null;

function loadModel() {
  if (!modelPromise) modelPromise = mobilenet.load({ version: 2, alpha: 1.0 });
  return modelPromise;
}

// Map raw ImageNet labels to cleaner, friendlier tags.
function normalizeLabels(predictions) {
  const tags = [];
  for (const p of predictions) {
    // labels look like "alp, mountain" or "seashore, coast, seacoast"
    p.className
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 2)
      .forEach((name) => {
        if (!tags.find((t) => t.name === name)) {
          tags.push({ name, confidence: Number(p.probability.toFixed(3)) });
        }
      });
  }
  return tags.slice(0, 6);
}

/**
 * Generate tags for an image element. Returns [{ name, confidence }].
 * Fails soft: returns [] if the model can't load (e.g. offline).
 */
export async function generateTags(imgEl) {
  try {
    const model = await loadModel();
    const predictions = await model.classify(imgEl, 5);
    return normalizeLabels(predictions.filter((p) => p.probability > 0.08));
  } catch (e) {
    console.warn('Tagging unavailable:', e.message);
    return [];
  }
}

export const warmTagger = loadModel;
