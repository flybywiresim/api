import { CacheInterceptor, CacheTTL, Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { AtisService } from './atis.service';
import { Observable } from 'rxjs';
import { Atis } from './atis.interface';

@Controller('atis')
@UseInterceptors(CacheInterceptor)
export class AtisController {
  constructor(private atis: AtisService) {
  }

  @Get(':icao')
  @CacheTTL(120)
  getForICAO(@Param('icao') icao: string, @Query('source') source?: string): Observable<Atis> {
    return this.atis.getForICAO(icao, source);
  }
}
