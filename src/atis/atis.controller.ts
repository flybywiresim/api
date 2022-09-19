import { CacheInterceptor, CacheTTL, Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AtisService } from './atis.service';
import { Atis } from './atis.class';

@ApiTags('ATIS')
@Controller('atis')
@UseInterceptors(CacheInterceptor)
export class AtisController {
    constructor(private atis: AtisService) {
    }

  @Get(':icao')
  @CacheTTL(120)
  @ApiParam({ name: 'icao', description: 'The ICAO of the airport to search for', example: 'KLAX' })
  @ApiQuery({
      name: 'source',
      description: 'The source for the ICAO',
      example: 'faa',
      required: false,
      enum: ['faa', 'vatsim', 'ivao', 'pilotedge', 'poscon'],
  })
  @ApiOkResponse({ description: 'ATIS notice was found', type: Atis })
  @ApiNotFoundResponse({ description: 'ATIS not available for ICAO' })
    getForICAO(@Param('icao') icao: string, @Query('source') source?: string): Promise<Atis> {
        return this.atis.getForICAO(icao, source);
    }
}
