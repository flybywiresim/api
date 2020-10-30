import * as fs from 'fs';

export default () => ({
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT) || 3306,
    database: process.env.DATABASE_DATABASE || 'fbw',
    username: process.env.DATABASE_USERNAME || 'fbw',
    password: envOrFile('DATABASE_PASSWORD'),
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
  },
  telex: {
    timeoutMin: parseInt(process.env.TELEX_TIMEOUT_MIN) || 6,
  },
  auth: {
    secret: envOrFile('AUTH_SECRET') || 'FlyByWire',
    expires: process.env.AUTH_EXPIRES || '12h',
  },
});

function envOrFile(envName: string): string {
  if (process.env[envName]) {
    return process.env[envName]
  }

  if (process.env[envName + '_FILE']) {
    return fs.readFileSync(process.env[envName + '_FILE']).toString();
  }

  return "";
}