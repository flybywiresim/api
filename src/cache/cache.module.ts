import * as redisStore from 'cache-manager-redis-store';
import { CacheModule as NestCache, Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    NestCache.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('redis.host'),
        port: configService.get<number>('redis.port'),
      }),
    }),
  ],
  exports: [
    NestCache
  ],
})
export class CacheModule {}
