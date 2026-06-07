import dotenv from 'dotenv';
dotenv.config();

const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'dev-insecure-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  storageDriver: process.env.STORAGE_DRIVER || 'local',
  publicUrl: process.env.PUBLIC_URL || 'http://localhost:5000',

  aws: {
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    bucket: process.env.AWS_S3_BUCKET,
  },

  aiDriver: process.env.AI_DRIVER || 'local',
  faceMatchThreshold: parseFloat(process.env.FACE_MATCH_THRESHOLD || '0.55'),
};

export default env;
