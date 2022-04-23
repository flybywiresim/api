import { HttpException, HttpService, Injectable, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Atis } from './atis.class';
import { CacheService } from '../cache/cache.service';
import { VatsimService } from '../utilities/vatsim.service';
import { IvaoService } from '../utilities/ivao.service';

@Injectable()
export class AtisService {
  private readonly logger = new Logger(AtisService.name);

  constructor(private http: HttpService,
              private readonly cache: CacheService,
              private readonly vatsim: VatsimService,
              private readonly ivao : IvaoService) {
  }

  getForICAO(icao: string, source?: string): Promise<Atis> {
      const icaoCode = icao.toUpperCase();
      this.logger.debug(`Searching for ICAO ${icaoCode} from source ${source}`);

      switch (source?.toLowerCase()) {
      case 'faa':
      default:
          return this.handleFaa(icaoCode).toPromise();
      case 'vatsim':
          return this.handleVatsim(icaoCode);
      case 'ivao':
          return this.handleIvao(icaoCode);
      case 'pilotedge':
          return this.handlePilotEdge(icaoCode).toPromise();
      }
  }

  // FAA
  private handleFaa(icao: string): Observable<Atis> {
      return this.http.get<any>(`https://datis.clowd.io/api/${icao}`)
          .pipe(
              tap((response) => this.logger.debug(`Response status ${response.status} for FAA ATIS request`)),
              map((response) => {
                  if (response.data.error) {
                      throw this.generateNotAvailableException(response.data, icao);
                  }

                  const atis: Atis = {
                      icao,
                      source: 'FAA',
                  };

                  response.data.forEach((x) => {
                      atis[x.type] = x.datis;
                  });

          atis.dep?.toUpperCase();
          atis.arr?.toUpperCase();
          atis.combined?.toUpperCase();

          return atis;
              }),
              catchError(
                  (err) => {
                      throw this.generateNotAvailableException(err, icao);
                  },
              ),
          );
  }

  private handleVatsim(icao: string): Promise<Atis> {
      return this.vatsim.fetchVatsimData()
          .then((response) => ({
              icao,
              source: 'Vatsim',
              combined: response.atis
                  .find((x) => x.callsign === `${icao}_ATIS`)
                  .text_atis
                  .join(' ')
                  .toUpperCase(),
          }))
          .catch((e) => {
              throw this.generateNotAvailableException(e, icao);
          });
  }

  private handleIvao(icao: string): Promise<Atis> {
      return this.ivao.fetchIvaoData()
          .then((response) => ({
              icao,
              source: 'IVAO',
              combined: response
                  .find((x) => x.startsWith(`${icao}_TWR`))
                  .split(':')[35]
                  .split('^§')
                  .slice(1)
                  .join(' ')
                  .toUpperCase(),
          }))
          .catch((e) => {
              throw this.generateNotAvailableException(e, icao);
          });
  }

  // PilotEdge
  private handlePilotEdge(icao: string): Observable<Atis> {
      return this.http.get<any>(`https://www.pilotedge.net/atis/${icao}.json`)
          .pipe(
              tap((response) => this.logger.debug(`Response status ${response.status} for PilotEdge ATIS request`)),
              map((response) => ({
                  icao,
                  source: 'FAA',
                  combined: response.data.text.replace('\n\n', ' ').toUpperCase(),
              })),
              catchError(
                  (err) => {
                      throw this.generateNotAvailableException(err, icao);
                  },
              ),
          );
  }

  private generateNotAvailableException(err: any, icao: string) {
      const exception = new HttpException(`ATIS not available for ICAO: ${icao}`, 404);
      this.logger.error(err);
      this.logger.error(exception);
      return exception;
  }
}
