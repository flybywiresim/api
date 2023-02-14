import { HttpException, HttpService, Injectable, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import * as parser from 'fast-xml-parser';
import { Taf } from './taf.class';
import { CacheService } from '../cache/cache.service';

// TODO: investigate
// For some reason iconv is not working with import
// eslint-disable-next-line @typescript-eslint/no-var-requires
const iconv = require('iconv-lite');

@Injectable()
export class TafService {
  private readonly logger = new Logger(TafService.name);

  constructor(private http: HttpService,
              private readonly cache: CacheService) {
  }

  getForICAO(icao: string, source?: string): Promise<Taf> {
      const icaoCode = icao.toUpperCase();
      this.logger.debug(`Searching for ICAO ${icaoCode} from source ${source}`);

      switch (source?.toLowerCase()) {
      case 'aviationweather':
      default:
          return this.handleAviationWeather(icaoCode).toPromise();
      case 'faa':
          return this.handleFaa(icaoCode);
      case 'poscon':
          return this.handlePOSCON(icaoCode).toPromise();
      }
  }

  // AviationWeather
  private handleAviationWeather(icao: string): Observable<Taf> {
      return this.http.get<any>(
          'https://www.aviationweather.gov/adds/dataserver_current/httpparam?dataSource=tafs'
      + `&requestType=retrieve&format=xml&stationString=${icao}&hoursBeforeNow=0`,
      )
          .pipe(
              tap((response) => this.logger.debug(`Response status ${response.status} for AviationWeather TAF request`)),
              map((response) => {
                  const obj = parser.parse(response.data);

                  return {
                      source: 'AviationWeather',
                      icao,
                      taf: obj.response.data.TAF[0].raw_text.toUpperCase(),
                  };
              }),
              catchError(
                  (err) => {
                      throw this.generateNotAvailableException(err, icao);
                  },
              ),
          );
  }

  // FAA
  private async fetchFaaBlob(): Promise<string[]> {
      const cacheHit = await this.cache.get<string[]>('/taf/blob/faa');

      if (cacheHit) {
          this.logger.debug('Returning from cache');
          return cacheHit;
      }
      const data = await this.http.get<any>('http://wx.ivao.aero/taf.php')
          .pipe(
              tap((response) => this.logger.debug(`Response status ${response.status} for FAA TAF request`)),
              map((response) => iconv
                  .decode(response.data, 'ISO-8859-1')
                  .split(/\r?\n/)),
          ).toPromise();

      this.cache.set('/taf/blob/faa', data, 240).then();
      return data;
  }

  private handleFaa(icao: string): Promise<Taf> {
      return this.fetchFaaBlob()
          .then((response) => ({
              source: 'FAA',
              icao,
              taf: response.find((x) => x.startsWith(icao)).toUpperCase(),
          }))
          .catch((e) => {
              throw this.generateNotAvailableException(e, icao);
          });
  }

  private handlePOSCON(icao: string): Observable<Taf> {
      return this.http.get<any>(`https://services.poscon.com/taf/${icao}`)
          .pipe(
              tap((response) => this.logger.debug(`Response status ${response.status} for POSCON TAF request`)),
              map((response) => ({
                  icao,
                  taf: response.data.taf,
                  source: 'POSCON',
              })),
          );
  }

  private generateNotAvailableException(err: any, icao: string): HttpException {
      const exception = new HttpException(`TAF not available for ICAO: ${icao}`, 404);
      this.logger.error(err);
      this.logger.error(exception);
      return exception;
  }
}
