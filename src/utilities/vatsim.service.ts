import { HttpService, Injectable, Logger } from '@nestjs/common';
import { map, tap } from 'rxjs/operators';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class VatsimService {
  private readonly logger = new Logger(VatsimService.name);

  constructor(
    private http: HttpService,
    private readonly cache: CacheService,
  ) {}

  public async fetchVatsimData(): Promise<any> {
      const cacheHit = await this.cache.get('/vatsim/data');

      if (cacheHit) {
          this.logger.debug('Returning from cache');
          return cacheHit;
      }
      const data = await this.http.get<any>('https://data.vatsim.net/v3/vatsim-data.json')
          .pipe(
              tap((response) => this.logger.debug(`Response status ${response.status} for VATSIM request`)),
              map((response) => response.data),
          ).toPromise();

      this.cache.set('/vatsim/data', data, 120).then();
      return data;
  }

  public async fetchVatsimTransceivers(): Promise<any> {
      const cacheHit = await this.cache.get('/vatsim/transceivers');

      if (cacheHit) {
          this.logger.debug('Returning from cache');
          return cacheHit;
      }
      const data = await this.http.get<any>('https://data.vatsim.net/v3/transceivers-data.json')
          .pipe(
              tap((response) => this.logger.debug(`Response status ${response.status} for VATSIM request`)),
              map((response) => response.data),
          ).toPromise();

      this.cache.set('/vatsim/transceivers', data, 120).then();
      return data;
  }
}
