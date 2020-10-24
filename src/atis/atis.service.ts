import { HttpException, HttpService, Injectable, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Atis } from './atis.interface';

// For some reason iconv is not working with import
// eslint-disable-next-line @typescript-eslint/no-var-requires
const iconv = require('iconv-lite');

@Injectable()
export class AtisService {
  private readonly logger = new Logger(AtisService.name);

  constructor(private http: HttpService) {
  }

  getForICAO(icao: string, source?: string): Observable<Atis> {
    const i = icao.toUpperCase();
    this.logger.debug(`Searching for ICAO ${i} from source ${source}`);

    switch (source?.toLowerCase()) {
      case 'faa':
      default:
        return this.handleFaa(i);
      case 'vatsim':
        return this.handleVatsim(i);
      case 'ivao':
        return this.handleIvao(i);
      case 'pilotedge':
        return this.handlePilotEdge(i);
    }
  }

  // FAA
  private handleFaa(icao: string): Observable<Atis> {
    return this.http.get<any>('https://datis.clowd.io/api/' + icao)
      .pipe(
        tap(response => this.logger.debug(`Response status ${response.status} for FAA ATIS request`)),
        map(response => {
          if (response.data.hasOwnProperty('error')) {
            throw this.generateNotAvailableException(response.data, icao);
          }

          const atis: Atis = {
            icao,
            source: 'FAA',
          };

          response.data.forEach(x => {
            atis[x.type] = x.datis;
          });

          atis.dep?.toUpperCase();
          atis.arr?.toUpperCase();
          atis.combined?.toUpperCase();

          return atis;
        }),
        catchError(
          err => {
            throw this.generateNotAvailableException(err, icao);
          },
        ),
      );
  }

  // Vatsim
  // TODO: Cache
  private fetchVatsimBlob(): Observable<any> {
    return this.http.get<any>('http://cluster.data.vatsim.net/vatsim-data.json')
      .pipe(
        tap(response => this.logger.debug(`Response status ${response.status} for VATSIM ATIS request`)),
        map(response => {
          return response.data;
        }),
      );
  }

  private handleVatsim(icao: string): Observable<Atis> {
    return this.fetchVatsimBlob()
      .pipe(
        tap(response => this.logger.debug(`Response contains ${response.clients.length} entries`)),
        map(response => {
          return {
            icao,
            source: 'Vatsim',
            combined: response.clients
              .find(x => x.callsign === icao + '_ATIS').atis_message
              .replace('^§', ' ')
              .toUpperCase(),
          };
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
    return this.http.get<Buffer>('https://api.ivao.aero/getdata/whazzup/whazzup.txt', { responseType: 'arraybuffer' })
      .pipe(
        tap(response => this.logger.debug(`Response status ${response.status} for IVAO ATIS request`)),
        map(response => {
          return iconv
            .decode(response.data, 'ISO-8859-1')
            .split(/\r?\n/);
        }),
      );
  }

  private handleIvao(icao: string): Observable<Atis> {
    return this.fetchIvaoBlob()
      .pipe(
        tap(response => this.logger.debug(`Response contains ${response.length} entries`)),
        map(response => {
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
        }),
        catchError(
          err => {
            throw this.generateNotAvailableException(err, icao);
          },
        ),
      );
  }

  // PilotEdge
  private handlePilotEdge(icao: string): Observable<Atis> {
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

  private generateNotAvailableException(err: any, icao: string): HttpException {
    this.logger.error(err.message || JSON.stringify(err));
    throw new HttpException('ATIS not available for ICAO: ' + icao, 404);
  }
}
