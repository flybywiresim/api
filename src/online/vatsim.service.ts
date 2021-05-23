import { HttpService, Injectable, Logger } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';
import { ATCInfo } from './atc-info.class';
import { OnlineService } from './online.service';

@Injectable()
export class VatsimService {
  private readonly logger = new Logger(VatsimService.name);

  constructor(
    private http: HttpService,
    private readonly cache: CacheService,
    private onlineService: OnlineService
  ) {}

  public async getControllers(): Promise<ATCInfo[]> {
      const fetch = require('node-fetch');
      const data: any = await (
          await fetch('https://data.vatsim.net/v3/vatsim-data.json')
      ).json();

      const transceivers: any = await (
          await fetch('https://data.vatsim.net/v3/transceivers-data.json')
      ).json();

      const arr: ATCInfo[] = [];
      for (const c of data.controllers) {
          const trans = transceivers.find((t) => t.callsign === c.callsign);
          const position = this.onlineService.getCenterOfCoordinates(trans?.transceivers);

          arr.push({
              callsign: c.callsign,
              frequency: c.frequency,
              textAtis: c.text_atis,
              visualRange: c.visual_range,
              type: this.onlineService.callSignToAtcType(c.callsign),
              latitude: position ? position[0] : null,
              longitude: position ? position[1] : null,
          });
      }

      return arr.filter((c) => c.type !== 'Unknow');
  }
}
