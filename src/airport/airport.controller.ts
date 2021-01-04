import { Body, CacheInterceptor, CacheTTL, Controller, Get, Param, Post, UseInterceptors } from '@nestjs/common';
import { ApiBody, ApiNotFoundResponse, ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { AirportService } from './airport.service';
import { Airport, AirportBatchDto } from './airport.class';

@ApiTags('Airport')
@Controller('api/v1/airport')
@UseInterceptors(CacheInterceptor)
export class AirportController {
  constructor(private airport: AirportService) {
  }

  @Post('_batch')
  @ApiBody({
    description: 'List of all ICAOs to fetch',
    type: AirportBatchDto
  })
  @ApiOkResponse({ description: 'List of found airports', type: [Airport]})
  getBatch(@Body() body: AirportBatchDto): Promise<Airport[]> {
    return this.airport.getBatch(body);
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
