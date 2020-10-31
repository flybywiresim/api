import * as redisStore from 'cache-manager-redis-store';
import { CacheModule, HttpModule, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MetarController } from './metar/metar.controller';
import { MetarService } from './metar/metar.service';
import { AtisController } from './atis/atis.controller';
import { AtisService } from './atis/atis.service';
import { TelexConnectionController } from './telex/telex-connection.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelexModule } from './telex/telex.module';
import { TelexConnection } from './telex/telex-connection.entity';
import { TelexMessage } from './telex/telex-message.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TafController } from './taf/taf.controller';
import { TafService } from './taf/taf.service';
import configuration from './config/configuration';
import { ScheduleModule } from '@nestjs/schedule';
import { FbwNamingStrategy } from './utilities/db-naming';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('redis.host'),
        port: configService.get<number>('redis.port'),
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [TelexConnection, TelexMessage],
        synchronize: true,
        legacySpatialSupport: false,
        namingStrategy: new FbwNamingStrategy(),
      }),
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ScheduleModule.forRoot(),
    WinstonModule.forRootAsync({
      imports: [ConfigService],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          levels: {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3,
            verbose: 4,
          },
          level: configService.get('logger.level'),
          format: configService.get('logger.format'),
          transports: [
            new winston.transports.Console(),
          ]
        };
      },
    }),
    TelexModule,
    HttpModule,
  ],
  controllers: [AppController, MetarController, AtisController, TelexConnectionController, TafController],
  providers: [MetarService, AtisService, TafService],
})
export class AppModule {
}
