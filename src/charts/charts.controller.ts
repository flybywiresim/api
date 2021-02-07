import { CacheInterceptor, CacheTTL, Controller, Get, Param, UseInterceptors } from '@nestjs/common';
import { ChartsService } from './charts.service';
import { Charts } from './charts.class';
import { ApiNotFoundResponse, ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';

@ApiTags('Charts')
@Controller('charts')
@UseInterceptors(CacheInterceptor)
export class ChartsController {
  constructor(private charts: ChartsService) {
  }

  @Get(':icao')
  @CacheTTL(3600)
  @ApiParam({ name: 'icao', description: 'The ICAO of the airport to search for', example: 'KLAX' })
  @ApiOkResponse({ description: 'Charts were found', type: Charts })
  @ApiNotFoundResponse({ description: 'Charts not available for ICAO' })
  getForICAO(@Param('icao') icao: string): Observable<Charts> {
    return this.charts.getForICAO(icao);
  }
}
