import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { AppController } from './app.controller';
import { MetarController } from './metar/metar.controller';
import { MetarService } from './metar/metar.service';
import { AtisController } from './atis/atis.controller';
import { AtisService } from './atis/atis.service';
import { TelexModule } from './telex/telex.module';
import { TafController } from './taf/taf.controller';
import { TafService } from './taf/taf.service';
import configuration from './config/configuration';
import { FbwNamingStrategy } from './utilities/db-naming';
import { CacheModule } from './cache/cache.module';
import { HealthModule } from './health/health.module';
import { AirportModule } from './airport/airport.module';
import { GitVersionsModule } from './git-versions/git-versions.module';
import { ChartsModule } from './charts/charts.module';
import { AtcController } from './atc/atc.controller';
import { VatsimService } from './utilities/vatsim.service';
import { AtcService } from './atc/atc.service';
import { IvaoService } from './utilities/ivao.service';
import { GnssModule } from './gnss/gnss.module';

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const masterHost = configService.get('database.host');
                const username = configService.get('database.username');
                const password = configService.get('database.password');
                const database = configService.get('database.database');
                const port = configService.get<number>('database.port');
                const replicas = configService.get<string>('database.replicas').split(';').filter((x) => x !== '');

                if (replicas.length > 0) {
                    return {
                        type: 'mysql',
                        replication: {
                            master: {
                                host: masterHost,
                                port,
                                username,
                                password,
                                database,
                            },
                            slaves: replicas.map((replica) => ({
                                host: replica,
                                port,
                                username,
                                password,
                                database,
                            })),
                        },
                        autoLoadEntities: true,
                        synchronize: true,
                        legacySpatialSupport: false,
                        namingStrategy: new FbwNamingStrategy(),
                        logging: configService.get('database.logging'),
                        extra: { connectionLimit: configService.get<number>('database.connectionLimit') },
                    };
                }

                return {
                    type: 'mysql',
                    host: masterHost,
                    port,
                    username,
                    password,
                    database,
                    autoLoadEntities: true,
                    synchronize: true,
                    legacySpatialSupport: false,
                    namingStrategy: new FbwNamingStrategy(),
                    logging: configService.get('database.logging'),
                    extra: { connectionLimit: configService.get<number>('database.connectionLimit') },
                };
            },
        }),
        ConfigModule.forRoot({
            isGlobal: true,
            load: [configuration],
        }),
        ScheduleModule.forRoot(),
        WinstonModule.forRootAsync({
            imports: [ConfigService],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
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
                ],
            }),
        }),
        TelexModule,
        HttpModule,
        CacheModule,
        HealthModule,
        AirportModule,
        GitVersionsModule,
        ChartsModule,
        GnssModule,
    ],
    controllers: [
        AppController,
        MetarController,
        AtisController,
        TafController,
        AtcController,
    ],
    providers: [MetarService, AtisService, TafService, VatsimService, IvaoService, AtcService],
})
export class AppModule {
}
