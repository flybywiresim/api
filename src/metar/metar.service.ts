import {
  HttpException,
  HttpService,
  Injectable, Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Metar } from './metar.class';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable()
export class MetarService {
  private readonly logger = new Logger(MetarService.name);

  constructor(private http: HttpService) {
  }

  getForICAO(icao: string, source?: string): Observable<Metar> {
    const icaoCode = icao.toUpperCase();
    this.logger.debug(`Searching for ICAO ${icaoCode} from source ${source}`);

    switch (source?.toLowerCase()) {
      case 'vatsim':
      default:
        return this.handleVatsim(icaoCode);
      case 'ms':
        return this.handleMs(icaoCode);
      case 'ivao':
        return this.handleIvao(icaoCode);
      case 'pilotedge':
        return this.handlePilotEdge(icaoCode);
    }
  }

  // Vatsim
  private handleVatsim(icao: string): Observable<Metar> {
    return this.http.get<string>('http://metar.vatsim.net/metar.php?id=' + icao)
      .pipe(
        tap(response => this.logger.debug(`Response status ${response.status} for Vatsim METAR request`)),
        map(response => {
          if (!response.data) {
            throw this.generateNotAvailableException('Empty response', icao);
          }

          return { icao: icao, metar: response.data, source: 'Vatsim' };
        }),
        catchError(
          err => {
            throw this.generateNotAvailableException(err, icao);
          },
        ),
      );
  }

  // MS
  // TODO: Cache
  fetchMsBlob(): Observable<string[]> {
    return this.http.get<string>('https://fsxweatherstorage.blob.core.windows.net/fsxweather/metars.bin')
      .pipe(
        tap(response => this.logger.debug(`Response status ${response.status} for MS METAR request`)),
        map(response => {
          return response.data.split(/\r?\n/);
        }),
      );
  }

  private handleMs(icao: string): Observable<Metar> {
    return this.fetchMsBlob()
      .pipe(
        tap(response => this.logger.debug(`Response contains ${response.length} entries`)),
        map(response => {
          return { icao: icao, metar: response.find(x => x.startsWith(icao)), source: 'MS' };
        }),
        catchError(
          err => {
            throw this.generateNotAvailableException(err, icao);
          },
        ),
      );
  }

  // IVAO
  // TODO: Cache
  private fetchIvaoBlob(): Observable<string[]> {
    return this.http.get<string>('http://wx.ivao.aero/metar.php')
      .pipe(
        tap(response => this.logger.debug(`Response status ${response.status} for IVAO METAR request`)),
        map(response => {
          return response.data.split(/\r?\n/);
        }),
      );
  }

  private handleIvao(icao: string): Observable<Metar> {
    return this.fetchIvaoBlob()
      .pipe(
        tap(response => this.logger.debug(`Response contains ${response.length} entries`)),
        map(response => {
          return { icao: icao, metar: response.find(x => x.startsWith(icao)), source: 'IVAO' };
        }),
        catchError(
          err => {
            throw this.generateNotAvailableException(err, icao);
          },
        ),
      );
  }

  // PilotEdge
  private handlePilotEdge(icao: string): Observable<Metar> {
    return this.http.get<any>('https://www.pilotedge.net/atis/' + icao + '.json')
      .pipe(
        tap(response => this.logger.debug(`Response status ${response.status} for PilotEdge METAR request`)),
        map(response => {
          return { icao: icao, metar: response.data.metar, source: 'PilotEdge' };
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
    throw new HttpException('METAR not available for ICAO: ' + icao, 404);
  }
}
