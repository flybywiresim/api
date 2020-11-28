import { HttpException, HttpService, Injectable, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Airport } from './airport.class';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable()
export class AirportService {
  private readonly logger = new Logger(AirportService.name);

  constructor(private http: HttpService) {
  }

  getForICAO(icao: string): Observable<Airport> {
    const icaoCode = icao.toUpperCase();
    this.logger.log(`Searching for ICAO '${icaoCode}'`);

    return this.http.get<any>(`https://ourairportapi.com/airport/${icaoCode}?expand=false`)
      .pipe(
        tap(response => this.logger.debug(`Response status ${response.status} for airport request`)),
        map(response => {
          if (response.data.errorMessage || response.data.count > 1) {
            throw new HttpException(`Airport with ICAO '${icaoCode}' not found`, 404);
          }

          const foundAirport = response.data.results[0];
          const airport: Airport = {
            icao: foundAirport.icao,
            type: foundAirport.type,
            name: foundAirport.name,
            lat: foundAirport.lat,
            lon: foundAirport.lon,
            elevation: foundAirport.elev,
            continent: foundAirport.continent,
            country: foundAirport.country,
          };

          return airport;
        }),
        catchError(
          err => {
            this.logger.error(err);
            throw new HttpException(`Airport with ICAO '${icaoCode}' not found`, 404);
          },
        ),
      );
  }
}
