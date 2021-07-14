import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CacheInterceptor, CacheTTL, Controller, Get, Logger, UseInterceptors } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Cron } from '@nestjs/schedule';
import { GnssService } from './gnss.service';
import { SatelliteInfo } from './dto/satellite-info.dto';
import { CacheService } from '../cache/cache.service';

@ApiTags('GNSS')
@Controller('api/v1/gnss')
@UseInterceptors(CacheInterceptor)
export class GnssController {
    private readonly logger = new Logger(GnssController.name);

    constructor(
        private service: GnssService,
        private cache: CacheService,
    ) {}

    @Get()
    @CacheTTL(3600) // 1h
    @ApiOkResponse({ description: 'Satellite data for the GNSS constellation', type: [SatelliteInfo] })
    getGnssInfo(): Observable<SatelliteInfo[]> {
        return this.service.getGnssInfo();
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
