import { PrismaClient } from '@prisma/client';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

// Neon's serverless driver needs a WebSocket implementation in Node.
neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis;

const logLevels = process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'];

function createPrisma() {
  const url = process.env.DATABASE_URL || '';

  // For Neon, connect through the serverless driver adapter (over WebSocket).
  // This avoids the native query engine's TLS/OpenSSL issues on some hosts.
  if (url.includes('neon.tech')) {
    const pool = new Pool({ connectionString: url });
    const adapter = new PrismaNeon(pool);
    return new PrismaClient({ adapter, log: logLevels });
  }

  // Fallback: standard connection (local Postgres, other providers).
  return new PrismaClient({ log: logLevels });
}

export const prisma = globalForPrisma.prisma || createPrisma();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
