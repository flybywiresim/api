import { HttpModule, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MetarController } from './metar/metar.controller';
import { MetarService } from './metar/metar.service';
import { AtisController } from './atis/atis.controller';
import { AtisService } from './atis/atis.service';
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
import { CacheModule } from './cache/cache.module';
import * as winston from 'winston';
import { HealthModule } from './health/health.module';
import { AirportController } from './airport/airport.controller';
import { AirportService } from './airport/airport.service';

@Module({
  imports: [
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
        logging: configService.get('database.logging'),
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
    CacheModule,
    HealthModule,
  ],
  controllers: [
    AppController,
    MetarController,
    AtisController,
    TafController,
    AirportController,
  ],
  providers: [MetarService, AtisService, TafService, AirportService],
})
export class AppModule {
}
