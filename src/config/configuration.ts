import * as fs from 'fs';

export default () => ({
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT) || 3306,
    database: process.env.DATABASE_DATABASE || 'fbw',
    username: process.env.DATABASE_USERNAME || 'fbw',
    password: process.env.DATABASE_PASSWORD || fs.readFileSync(process.env.DATABASE_PASSWORD_FILE),
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
  },
  telex: {
    timeoutMin: parseInt(process.env.TELEX_TIMEOUT_MIN) || 6,
  },
  auth: {
    secret: process.env.AUTH_SECRET || fs.readFileSync(process.env.AUTH_SECRET_FILE) || 'FlyByWire',
    expires: process.env.AUTH_EXPIRES || '12h',
  },
});