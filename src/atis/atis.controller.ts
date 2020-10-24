import { CacheInterceptor, CacheTTL, Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { AtisService } from './atis.service';

@Controller('atis')
@UseInterceptors(CacheInterceptor)
export class AtisController {
  constructor(private atis: AtisService) {
  }

  @Get(':icao')
  @CacheTTL(120)
  getForICAO(@Param('icao') icao: string, @Query('source') source?: string) {
    return this.atis.getForICAO(icao, source);
  }
}
