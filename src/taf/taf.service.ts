import { HttpException, HttpService, Injectable, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Taf } from './taf.interface';
import * as parser from 'fast-xml-parser';

// TODO: investigate
// For some reason iconv is not working with import
// eslint-disable-next-line @typescript-eslint/no-var-requires
const iconv = require('iconv-lite');

@Injectable()
export class TafService {
  private readonly logger = new Logger(TafService.name);

  constructor(private http: HttpService) {
  }

  getForICAO(icao: string, source?: string): Observable<Taf> {
    const icaoCode = icao.toUpperCase();
    this.logger.debug(`Searching for ICAO ${icaoCode} from source ${source}`);

    switch (source?.toLowerCase()) {
      case 'aviationweather':
      default:
        return this.handleAviationWeather(icaoCode);
      case 'faa':
        return this.handleFaa(icaoCode);
    }
  }

  // AviationWeather
  private handleAviationWeather(icao: string): Observable<Taf> {
    return this.http.get<any>(`https://www.aviationweather.gov/adds/dataserver_current/httpparam?dataSource=tafs&requestType=retrieve&format=xml&stationString=${icao}&hoursBeforeNow=0`)
      .pipe(
        tap(response => this.logger.debug(`Response status ${response.status} for AviationWeather TAF request`)),
        map(response => {
            const obj = parser.parse(response.data);

            return {
              source: 'AviationWeather',
              icao,
              taf: obj.response.data.TAF[0].raw_text.toUpperCase(),
            };
        }),
        catchError(
          err => {
            throw this.generateNotAvailableException(err, icao);
          },
        ),
      );
  }

  // FAA
  // TODO: Cache
  private fetchFaaBlob(): Observable<string[]> {
    return this.http.get<any>('http://wx.ivao.aero/taf.php')
      .pipe(
        tap(response => this.logger.debug(`Response status ${response.status} for FAA TAF request`)),
        map(response => {
          return iconv
            .decode(response.data, 'ISO-8859-1')
            .split(/\r?\n/);
        }),
      );
  }

  private handleFaa(icao: string): Observable<Taf> {
    return this.fetchFaaBlob()
      .pipe(
        tap(response => this.logger.debug(`Response contains ${response.length} entries`)),
        map(response => {
          return {
            source: 'FAA',
            icao,
            taf: response.find(x => x.startsWith(icao)).toUpperCase(),
          };
        }),
        catchError(
          err => {
            throw this.generateNotAvailableException(err, icao);
          },
        ),
      );
  }

  private generateNotAvailableException(err: any, icao: string): HttpException {
    this.logger.error(err.message || JSON.stringify(err));
    throw new HttpException('ATIS not available for ICAO: ' + icao, 404);
  }
}
