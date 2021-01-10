import { CacheInterceptor, CacheTTL, Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { TafService } from './taf.service';
import { Taf } from './taf.class';
import { ApiNotFoundResponse, ApiOkResponse, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('TAF')
@Controller('taf')
@UseInterceptors(CacheInterceptor)
export class TafController {
  constructor(private taf: TafService) {
  }

  @Get(':icao')
  @CacheTTL(120)
  @ApiParam({ name: 'icao', description: 'The ICAO of the airport to search for', example: 'KLAX' })
  @ApiQuery({ name: 'source', description: 'The source for the TAF', example: 'faa', required: false, enum: ['aviationweather', 'faa']})
  @ApiOkResponse({ description: 'TAF notice was found', type: Taf })
  @ApiNotFoundResponse( { description: 'TAF not available for ICAO' })
  getForICAO(@Param('icao') icao: string, @Query('source') source?: string): Promise<Taf> {
    return this.taf.getForICAO(icao, source);
  }
}
