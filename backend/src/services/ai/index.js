import env from '../../config/env.js';
import { localAI } from './local.js';
import { rekognitionAI } from './rekognition.js';

// AI abstraction. Controllers depend only on `ai.matchFaces(descriptor)`.
export const ai = env.aiDriver === 'rekognition' ? rekognitionAI : localAI;

export default ai;
