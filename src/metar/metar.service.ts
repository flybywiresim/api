import {
    HttpException,
    HttpService,
    Injectable, Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Metar } from './metar.class';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class MetarService {
  private readonly logger = new Logger(MetarService.name);

  constructor(private http: HttpService,
              private readonly cache: CacheService) {
  }

  getForICAO(icao: string, source?: string): Promise<Metar> {
      const icaoCode = icao.toUpperCase();
      this.logger.debug(`Searching for ICAO ${icaoCode} from source ${source}`);

      switch (source?.toLowerCase()) {
      case 'vatsim':
      default:
          return this.handleVatsim(icaoCode).toPromise();
      case 'ms':
          return this.handleMs(icaoCode);
      case 'pilotedge':
          return this.handlePilotEdge(icaoCode).toPromise();
      case 'poscon':
          return this.handlePOSCON(icaoCode).toPromise();
      }
  }

  // Vatsim
  private handleVatsim(icao: string): Observable<Metar> {
      return this.http.get<string>(`http://metar.vatsim.net/metar.php?id=${icao}`)
          .pipe(
              tap((response) => this.logger.debug(`Response status ${response.status} for Vatsim METAR request`)),
              map((response) => {
                  if (!response.data) {
                      throw this.generateNotAvailableException('Empty response', icao);
                  }

                  return { icao, metar: response.data, source: 'Vatsim' };
              }),
              catchError(
                  (err) => {
                      throw this.generateNotAvailableException(err, icao);
                  },
              ),
          );
  }

  // MS
  async fetchMsBlob(): Promise<string[]> {
      const cacheHit = await this.cache.get<string[]>('/metar/blob/ms');

      if (cacheHit) {
          this.logger.debug('Returning from cache');
          return cacheHit;
      }
      const data = await this.http.get<string>('https://fsxweatherstorage.blob.core.windows.net/fsxweather/metars.bin')
          .pipe(
              tap((response) => this.logger.debug(`Response status ${response.status} for MS METAR request`)),
              map((response) => response.data.split(/\r?\n/)),
          ).toPromise();

      this.cache.set('/metar/blob/ms', data, 240).then();
      return data;
  }

  private handleMs(icao: string): Promise<Metar> {
      return this.fetchMsBlob()
          .then((response) => ({ icao, metar: response.find((x) => x.startsWith(icao)), source: 'MS' }))
          .catch((e) => {
              throw this.generateNotAvailableException(e, icao);
          });
  }

  // IVAO
  private async fetchIvaoBlob(): Promise<string[]> {
      const cacheHit = await this.cache.get<string[]>('/metar/blob/ivao');

      if (cacheHit) {
          this.logger.debug('Returning from cache');
          return cacheHit;
      }
      const data = await this.http.get<string>('http://wx.ivao.aero/metar.php')
          .pipe(
              tap((response) => this.logger.debug(`Response status ${response.status} for IVAO METAR request`)),
              map((response) => response.data.split(/\r?\n/)),
          ).toPromise();

      this.cache.set('/metar/blob/ivao', data, 240).then();
      return data;
  }

  private handleIvao(icao: string): Promise<Metar> {
      return this.fetchIvaoBlob()
          .then((response) => ({ icao, metar: response.find((x) => x.startsWith(icao)), source: 'IVAO' }))
          .catch((e) => {
              throw this.generateNotAvailableException(e, icao);
          });
  }

  // PilotEdge
  private handlePilotEdge(icao: string): Observable<Metar> {
      return this.http.get<any>(`https://www.pilotedge.net/atis/${icao}.json`)
          .pipe(
              tap((response) => this.logger.debug(`Response status ${response.status} for PilotEdge METAR request`)),
              map((response) => ({ icao, metar: response.data.metar, source: 'PilotEdge' })),
              catchError(
                  (err) => {
                      throw this.generateNotAvailableException(err, icao);
                  },
              ),
          );
  }

  // POSCON
  private handlePOSCON(icao: string): Observable<Metar> {
      return this.http.get<any>(`https://services.poscon.com/metar/${icao}`)
          .pipe(
              tap((response) => this.logger.debug(`Response status ${response.status} for POSCON METAR request`)),
              map((response) => ({ icao, metar: response.data.metar, source: 'POSCON' })),
              catchError(
                  (err) => {
                      throw this.generateNotAvailableException(err, icao);
                  },
              ),
          );
  }

  private generateNotAvailableException(err: any, icao: string): HttpException {
      const exception = new HttpException(`METAR not available for ICAO: ${icao}`, 404);
      this.logger.error(err);
      this.logger.error(exception);
      return exception;
  }
}
