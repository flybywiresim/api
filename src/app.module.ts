import * as redisStore from 'cache-manager-redis-store';
import { CacheModule, HttpModule, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
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

@Module({
  imports: [
    HttpModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('redis.host'),
        port: configService.get<number>('redis.port'),
      }),
      inject: [ConfigService],
    }), TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
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
      }),
      inject: [ConfigService],
    }),
    TelexModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
  ],
  controllers: [AppController, MetarController, AtisController, TelexConnectionController, TafController],
  providers: [AppService, MetarService, AtisService, TafService],
})
export class AppModule {
}
