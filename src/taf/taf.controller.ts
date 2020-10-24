import { CacheInterceptor, CacheTTL, Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { TafService } from './taf.service';
import { Taf } from './taf.interface';
import { Observable } from 'rxjs';

@Controller('taf')
@UseInterceptors(CacheInterceptor)
export class TafController {
  constructor(private taf: TafService) {
  }

  @Get(':icao')
  @CacheTTL(120)
  getForICAO(@Param('icao') icao: string, @Query('source') source?: string): Observable<Taf> {
    return this.taf.getForICAO(icao, source);
  }
}
