import { CacheInterceptor, CacheTTL, Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { MetarService } from './metar.service';
import { Observable } from 'rxjs';
import { Metar } from './metar.interface';

@Controller('metar')
@UseInterceptors(CacheInterceptor)
export class MetarController {
  constructor(private metar: MetarService) {
  }

  @Get(':icao')
  @CacheTTL(240)
  getForICAO(@Param('icao') icao: string, @Query('source') source?: string): Observable<Metar> {
    return this.metar.getForICAO(icao, source);
  }
}
