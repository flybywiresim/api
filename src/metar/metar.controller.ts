import { CacheInterceptor, CacheTTL, Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { MetarService } from './metar.service';
import { Metar } from './metar.class';
import { ApiNotFoundResponse, ApiOkResponse, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('METAR')
@Controller('metar')
@UseInterceptors(CacheInterceptor)
export class MetarController {
  constructor(private metar: MetarService) {
  }

  @Get(':icao')
  @CacheTTL(240)
  @ApiParam({ name: 'icao', description: 'The ICAO of the airport to search for', example: 'KLAX' })
  @ApiQuery({
    name: 'source',
    description: 'The source for the METAR',
    example: 'vatsim',
    required: false,
    enum: ['vatsim', 'ms', 'ivao', 'pilotedge']
  })
  @ApiOkResponse({ description: 'METAR notice was found', type: Metar })
  @ApiNotFoundResponse( { description: 'METAR not available for ICAO' })
  getForICAO(@Param('icao') icao: string, @Query('source') source?: string): Promise<Metar> {
    return this.metar.getForICAO(icao, source);
  }
}
