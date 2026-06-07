/**
 * AWS Rekognition AI driver (stub / drop-in).
 *
 * To enable:
 *   1. npm i @aws-sdk/client-rekognition
 *   2. Create a Rekognition collection and index faces on upload
 *      (IndexFaces) keyed by mediaId.
 *   3. Implement matchFaces() with SearchFacesByImage and set AI_DRIVER=rekognition.
 *
 * Kept as a stub so the project runs key-free with the local driver.
 */
export const rekognitionAI = {
  driver: 'rekognition',

  async matchFaces() {
    throw new Error(
      'Rekognition driver not implemented. Set AI_DRIVER=local or implement matchFaces() in services/ai/rekognition.js'
    );
  },
};
