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
        replicas: process.env.DATABASE_READ_ONLY_HOSTS || '',
    },
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
    },
    telex: {
        disableCleanup: envBool('TELEX_DISABLE_CLEANUP', true),
        timeoutMin: parseInt(process.env.TELEX_TIMEOUT_MIN) || 6,
        discordWebhook: process.env.TELEX_DISCORD_WEBHOOK || '',
    },
    auth: {
        secret: envOrFile('AUTH_SECRET', './secrets/jwt_secret.txt') || 'FlyByWire',
        expires: process.env.AUTH_EXPIRES || '12h',
    },
    github: { token: envOrFile('GITHUB_TOKEN', './secrets/github_token.txt') || '' },
});

function envOrFile(envName: string, defaultPath?: string): string {
    if (process.env[envName]) {
        return process.env[envName];
    }

    if (process.env[`${envName}_FILE`]) {
        return fs.readFileSync(process.env[`${envName}_FILE`]).toString().trim();
    }

    if (defaultPath && fs.existsSync(defaultPath)) {
        return fs.readFileSync(defaultPath).toString().trim();
    }

    return '';
}

function envBool(envName: string, defaultValue: boolean): boolean {
    if (process.env[envName]) {
        return process.env[envName].toLowerCase() === 'true';
    }

    return defaultValue;
}

function getLoggingFormat(env: string) {
    switch (env) {
    case 'json':
    default:
        return winston.format.json();
    case 'splat':
        return winston.format.splat();
    case 'nest':
        return nestWinstonModuleUtilities.format.nestLike();
    }
}
