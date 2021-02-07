import { HttpException, HttpService, Injectable, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Charts } from './charts.class';

@Injectable()
export class ChartsService {
  private readonly logger = new Logger(ChartsService.name);

  constructor(private http: HttpService) {
  }

  getForICAO(icao: string): Observable<Charts> {
    const icaoCode = icao.toUpperCase();
    this.logger.debug(`Searching for ICAO ${icaoCode}`);

    return this.handleFaa(icaoCode);
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

          const regexp = /<span class="chartLink"><i class="icon-cog"><\/i> <a href="(.+)">(.+)<\/a><\/span>/g;
          const matches = [...response.data.matchAll(regexp)];

          return {
            icao,
            charts: matches.map(x => {
              return { url: x[1], name: x[2] };
            })
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
