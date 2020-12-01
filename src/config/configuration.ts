import * as fs from 'fs';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';

export default () => ({
  logger: {
    level: process.env.LOGGER_LEVEL || 'debug',
    format: getLoggingFormat(process.env.LOGGER_FORMAT),
  },
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT) || 3306,
    database: process.env.DATABASE_DATABASE || 'fbw',
    username: process.env.DATABASE_USERNAME || 'fbw',
    password: envOrFile('DATABASE_PASSWORD', './secrets/db_password.txt'),
    logging: process.env.DATABASE_LOGGING || 'error',
    connectionLimit: parseInt(process.env.DATABASE_CONN_LIMIT) || 10,
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
  },
  telex: {
    timeoutMin: parseInt(process.env.TELEX_TIMEOUT_MIN) || 6,
  },
  auth: {
    secret: envOrFile('AUTH_SECRET', './secrets/jwt_secret.txt') || 'FlyByWire',
    expires: process.env.AUTH_EXPIRES || '12h',
  },
});

function envOrFile(envName: string, defaultPath?: string): string {
  if (process.env[envName]) {
    return process.env[envName]
  }

  if (process.env[envName + '_FILE']) {
    return fs.readFileSync(process.env[envName + '_FILE']).toString();
  }

  if (defaultPath && fs.existsSync(defaultPath)) {
    return fs.readFileSync(defaultPath).toString();
  }

  return "";
}

function getLoggingFormat(env: string) {
  switch (env) {
    case 'json':
    default:
      return winston.format.json();
    case 'splat':
      return winston.format.splat();
    case 'nest':
      return  nestWinstonModuleUtilities.format.nestLike();
  }
}
