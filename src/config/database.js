import 'dotenv/config';

import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

const isNeonLocal =
  process.env.NEON_LOCAL === 'true' ||
  Boolean(process.env.NEON_LOCAL_HOST) ||
  /@neon-local[:/]/i.test(databaseUrl);

if (isNeonLocal) {
  const host = process.env.NEON_LOCAL_HOST || 'neon-local';
  const port = process.env.NEON_LOCAL_PORT || '5432';

  neonConfig.fetchEndpoint = `http://${host}:${port}/sql`;
  neonConfig.useSecureWebSocket = false;
  neonConfig.poolQueryViaFetch = true;
}

isNeonLocal ? console.log('Using Neon Local') : console.log('Using Neon Cloud');

const sql = neon(databaseUrl);
const db = drizzle(sql);

export { db, sql };
