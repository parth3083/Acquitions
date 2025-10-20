import 'dotenv/config';
import {neon, neonConfig} from '@neondatabase/serverless';
import {drizzle} from 'drizzle-orm/neon-http';

// Configure Neon based on environment
if (process.env.NODE_ENV === 'development') {
  // Neon Local configuration for development
  // The Neon Local container only supports HTTP-based communication
  neonConfig.fetchEndpoint = process.env.NEON_LOCAL_ENDPOINT || 'http://neon-local:5432/sql';
  neonConfig.useSecureWebSocket = false;
  neonConfig.poolQueryViaFetch = true;
  
  console.log('🔧 Database: Using Neon Local proxy for development');
} else {
  // Production: use default Neon serverless configuration
  console.log('🚀 Database: Using Neon Cloud for production');
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

export {db, sql};