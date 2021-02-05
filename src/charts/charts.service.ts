import { HttpException, HttpService, Injectable, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Charts } from './charts.class';
import { CacheService } from '../cache/cache.service';

// TODO: investigate
// For some reason iconv is not working with import
// eslint-disable-next-line @typescript-eslint/no-var-requires
const iconv = require('iconv-lite');

@Injectable()
export class ChartsService {
  private readonly logger = new Logger(ChartsService.name);

  constructor(private http: HttpService,
              private readonly cache: CacheService) {
  }

  getForICAO(icao: string): Promise<Charts> {
    const icaoCode = icao.toUpperCase();
    this.logger.debug(`Searching for ICAO ${icaoCode}`);

    return this.handleFaa(icaoCode).toPromise();
  }

  // FAA
  private handleFaa(icao: string): Observable<Charts> {
    return this.http.get<any>('https://nfdc.faa.gov/nfdcApps/services/ajv5/airportDisplay.jsp?airportId=' + icao)
      .pipe(
        tap(response => this.logger.debug(`Response status ${response.status} for FAA charts request`)),
        map(response => {
          if (response.data.hasOwnProperty('error')) {
            throw this.generateNotAvailableException(response.data, icao);
          }

          const regexp = /<span class="chartLink"><i class="icon-cog"><[\/]i> <a href="(.*)" /g;
          const matches = [...response.data.matchAll(regexp)];

          const charts: Charts = {
            icao
          };
          let urls = [];

          for (const match of matches) {
            urls.push(match[1]);
          }

          charts["charts"] = urls 

          return charts;
        }),
        catchError(
          err => {
            throw this.generateNotAvailableException(err, icao);
          },
        ),
      );
  }

  // Vatsim
  private async fetchVatsimBlob(): Promise<any> {
    const cacheHit = await this.cache.get('/atis/blob/vatsim');

    if (cacheHit) {
      this.logger.debug('Returning from cache');
      return cacheHit;
    } else {
      const data = await this.http.get<any>('http://cluster.data.vatsim.net/vatsim-data.json')
        .pipe(
          tap(response => this.logger.debug(`Response status ${response.status} for VATSIM ATIS request`)),
          tap(response => this.logger.debug(`Response contains ${response.data.clients.length} entries`)),
          map(response => {
            return response.data;
          }),
        ).toPromise();

      this.cache.set('/atis/blob/vatsim', data, 120).then();
      return data;
    }
  }

  private handleVatsim(icao: string): Promise<Charts> {
    return this.fetchVatsimBlob()
      .then(response => {
        return {
          icao,
          source: 'Vatsim',
          combined: response.clients
            .find(x => x.callsign === icao + '_ATIS').atis_message
            .replace(/\^§/g, ' ')
            .toUpperCase(),
        };
      })
      .catch(e => {
        throw this.generateNotAvailableException(e, icao);
      });
  }

  // IVAO
  private async fetchIvaoBlob(): Promise<string[]> {
    const cacheHit = await this.cache.get<string[]>('/atis/blob/ivao');

    if (cacheHit) {
      this.logger.debug('Returning from cache');
      return cacheHit;
    } else {
      const data = await this.http.get<Buffer>('https://api.ivao.aero/getdata/whazzup/whazzup.txt', { responseType: 'arraybuffer' })
        .pipe(
          tap(response => this.logger.debug(`Response status ${response.status} for IVAO ATIS request`)),
          tap(response => this.logger.debug(`Response contains ${response.data.length} entries`)),
          map(response => {
            return iconv
              .decode(response.data, 'ISO-8859-1')
              .split(/\r?\n/);
          }),
        ).toPromise();

      this.cache.set('/atis/blob/ivao', data, 120).then();
      return data;
    }
  }

  private handleIvao(icao: string): Promise<Charts> {
    return this.fetchIvaoBlob()
      .then(response => {
        return {
          icao,
          source: 'IVAO',
          combined: response
            .find(x => x.startsWith(icao + '_TWR'))
            .split(':')[35]
            .split('^§')
            .slice(1)
            .join(' ')
            .toUpperCase(),
        };
      })
      .catch(e => {
        throw this.generateNotAvailableException(e, icao);
      });
  }

  // PilotEdge
  private handlePilotEdge(icao: string): Observable<Charts> {
    return this.http.get<any>('https://www.pilotedge.net/atis/' + icao + '.json')
      .pipe(
        tap(response => this.logger.debug(`Response status ${response.status} for PilotEdge ATIS request`)),
        map(response => {
          return {
            icao,
            source: 'FAA',
            combined: response.data.text.replace('\n\n', ' ').toUpperCase(),
          };
        }),
        catchError(
          err => {
            throw this.generateNotAvailableException(err, icao);
          },
        ),
      );
  }

  private generateNotAvailableException(err: any, icao: string) {
    const exception = new HttpException('Charts not available for ICAO: ' + icao, 404);
    this.logger.error(err);
    this.logger.error(exception);
    return exception;
  }
}
