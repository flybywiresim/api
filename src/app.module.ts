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
import { Connection } from 'typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    HttpModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('REDIS_HOST'),
        port: configService.get<number>('REDIS_PORT'),
      }),
      inject: [ConfigService],
    }), TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: 'fbw',
        entities: [TelexConnection, TelexMessage],
        synchronize: true,
        legacySpatialSupport: false,
      }),
      inject: [ConfigService],
    }),
    TelexModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController, MetarController, AtisController, TelexConnectionController],
  providers: [AppService, MetarService, AtisService],
})
export class AppModule {
}
