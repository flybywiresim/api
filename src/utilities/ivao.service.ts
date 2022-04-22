import { HttpService, Injectable, Logger } from '@nestjs/common';
import { map, tap } from 'rxjs/operators';
import { CacheService } from '../cache/cache.service';

// TODO: investigate
// For some reason iconv is not working with import
// eslint-disable-next-line @typescript-eslint/no-var-requires
const iconv = require('iconv-lite');

@Injectable()
export class IvaoService {
  private readonly logger = new Logger(IvaoService.name);

  constructor(
    private http: HttpService,
    private readonly cache: CacheService,
  ) {}

  public async fetchIvaoData(): Promise<string[]> {
      const cacheHit = await this.cache.get<string[]>('/ivao/data');

      if (cacheHit) {
          this.logger.debug('Returning from cache');
          return cacheHit;
      }
      const data = await this.http.get<Buffer>('https://api.ivao.aero/getdata/whazzup/whazzup.txt', { responseType: 'arraybuffer' })
          .pipe(
              tap((response) => this.logger.debug(`Response status ${response.status} for IVAO  request`)),
              tap((response) => this.logger.debug(`Response contains ${response.data.length} entries`)),
              map((response) => iconv
                  .decode(response.data, 'ISO-8859-1')
                  .split(/\r?\n/)),
          ).toPromise();

      this.cache.set('/ivao/data', data, 120).then();
      return data;
  }
}
