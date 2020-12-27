import { CacheInterceptor, CacheTTL, Controller, Get, Param, UseInterceptors } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { AirportService } from './airport.service';
import { Airport } from './airport.class';

@ApiTags('Airport')
@Controller('api/v1/airport')
@UseInterceptors(CacheInterceptor)
export class AirportController {
  constructor(private airport: AirportService) {
  }

  @Get(':icao')
  @CacheTTL(86400)
  @ApiParam({ name: 'icao', description: 'The ICAO of the airport to search for', example: 'KLAX' })
  @ApiOkResponse({ description: 'Airport was found', type: Airport })
  @ApiNotFoundResponse( { description: 'Airport was not found' })
  getForICAO(@Param('icao') icao: string): Promise<Airport> {
    return this.airport.getForICAO(icao);
  }
}
