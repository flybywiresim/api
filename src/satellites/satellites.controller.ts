import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CacheInterceptor, CacheTTL, Controller, Get, Logger, Query, UseInterceptors } from '@nestjs/common';
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

    @Get()
    @CacheTTL(3600) // 1h
    @ApiQuery({
        name: 'type',
        description: 'The requested satellite type',
        example: 'gnss',
        required: true,
        enum: ['gnss', 'iridium', 'iridium-NEXT', 'starlink', 'galileo', 'glo-ops', 'beidou', 'intelsat'],
    })
    @ApiOkResponse({ description: 'Satellite data for the requested type constellation', type: [SatelliteInfo] })
    getGnssInfo(@Query('type') type: string): Observable<SatelliteInfo[]> {
        return this.service.getSatellitesInfo(type);
    }

    @Cron('0 1 * * *')
    async clearCache() {
        try {
            this.logger.log('Clearing GNSS cache');
            await this.cache.del('/api/v1/satellites');
        } catch (e) {
            this.logger.error(e);
        }
    }
}
