import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CacheInterceptor, CacheTTL, Controller, Get, Logger, UseInterceptors } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Cron } from '@nestjs/schedule';
import { SatellitesService } from './satellites.service';
import { SatelliteInfo } from './dto/satellite-info.dto';
import { CacheService } from '../cache/cache.service';

@ApiTags('Satellites')
@Controller('api/v1/satellites')
@UseInterceptors(CacheInterceptor)
export class SatellitesController {
    private readonly logger = new Logger(SatellitesController.name);

    constructor(
        private service: SatellitesService,
        private cache: CacheService,
    ) {}

    @Get('gnss')
    @CacheTTL(3600) // 1h
    @ApiOkResponse({ description: 'Satellite data for the GNSS constellation', type: [SatelliteInfo] })
    getGnssInfo(): Observable<SatelliteInfo[]> {
        return this.service.getGnssInfo();
    }

    @Get('iridium')
    @CacheTTL(3600) // 1h
    @ApiOkResponse({ description: 'Satellite data for the IRIDIUM constellation', type: [SatelliteInfo] })
    getIridiumInfo(): Observable<SatelliteInfo[]> {
        return this.service.getIridiumInfo();
    }

    @Cron('0 1 * * *')
    async clearCache() {
        try {
            this.logger.log('Clearing GNSS cache');
            await this.cache.del('/api/v1/gnss');
        } catch (e) {
            this.logger.error(e);
        }
    }
}
