#!/usr/bin/env node

/**
 * Setup script for Acquisitions application
 * Helps configure environment variables interactively
 */

import { createInterface } from 'readline';
import { writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function generateSecret(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function setup() {
  console.log('\n🚀 Acquisitions Application Setup\n');
  console.log('This script will help you create environment configuration files.\n');

  const envType = await question('Environment type? (1) Development (2) Production [1]: ');
  const isDev = !envType || envType === '1';
  const envFile = isDev ? '.env.development' : '.env.production';

  if (existsSync(join(__dirname, envFile))) {
    const overwrite = await question(`${envFile} already exists. Overwrite? (y/n) [n]: `);
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled.');
      rl.close();
      return;
    }
  }

  console.log(`\n📝 Configuring ${isDev ? 'Development' : 'Production'} Environment\n`);

  let config = `# ${isDev ? 'Development' : 'Production'} Environment Configuration
# Generated on ${new Date().toISOString()}
NODE_ENV=${isDev ? 'development' : 'production'}
PORT=3000

`;

  if (isDev) {
    // Development-specific configuration
    console.log('Neon Local Configuration:');
    console.log('Get these from: https://console.neon.tech\n');

    const neonApiKey = await question('Neon API Key: ');
    const neonProjectId = await question('Neon Project ID: ');
    const parentBranchId = await question('Parent Branch ID [main]: ') || 'main';

    config += `# Neon Local Configuration
NEON_API_KEY=${neonApiKey}
NEON_PROJECT_ID=${neonProjectId}
PARENT_BRANCH_ID=${parentBranchId}

# Database Configuration (Neon Local)
DATABASE_URL=postgres://neon:npg@localhost:5432/neondb?sslmode=require

`;
  } else {
    // Production-specific configuration
    console.log('Neon Cloud Configuration:');
    console.log('Get connection string from: https://console.neon.tech\n');

    const databaseUrl = await question('Production DATABASE_URL: ');

    config += `# Database Configuration (Neon Cloud)
DATABASE_URL=${databaseUrl}

`;
  }

  // Common configuration
  console.log('\nApplication Secrets:');
  const generateSecrets = await question('Generate random secrets? (y/n) [y]: ');
  
  let jwtSecret, cookieSecret;
  if (!generateSecrets || generateSecrets.toLowerCase() === 'y') {
    jwtSecret = generateSecret(64);
    cookieSecret = generateSecret(64);
    console.log('✅ Generated secure random secrets');
  } else {
    jwtSecret = await question('JWT_SECRET: ');
    cookieSecret = await question('COOKIE_SECRET: ');
  }

  const jwtExpiresIn = await question('JWT Expiration [7d]: ') || '7d';
  const arcjetKey = await question('ArcJet Key (optional): ') || '';

  config += `# JWT Configuration
JWT_SECRET=${jwtSecret}
JWT_EXPIRES_IN=${jwtExpiresIn}

# Cookie Configuration
COOKIE_SECRET=${cookieSecret}

# ArcJet Security
ARCJET_KEY=${arcjetKey}

# Logging
LOG_LEVEL=${isDev ? 'debug' : 'info'}
`;

  // Write the configuration file
  writeFileSync(join(__dirname, envFile), config);
  console.log(`\n✅ Created ${envFile}`);

  // Provide next steps
  console.log('\n📋 Next Steps:\n');
  if (isDev) {
    console.log('1. Review the generated .env.development file');
    console.log('2. Start the development environment:');
    console.log('   docker-compose -f docker-compose.dev.yml up --build');
    console.log('\n3. Access your app at http://localhost:3000');
  } else {
    console.log('1. Review the generated .env.production file');
    console.log('2. Run database migrations:');
    console.log('   docker-compose -f docker-compose.prod.yml run --rm app npm run db:migrate');
    console.log('\n3. Start production:');
    console.log('   docker-compose -f docker-compose.prod.yml up -d');
  }

  console.log('\n📚 For more information, see QUICKSTART.md or DOCKER_SETUP.md\n');

  rl.close();
}

setup().catch(error => {
  console.error('Error during setup:', error);
  rl.close();
  process.exit(1);
});
