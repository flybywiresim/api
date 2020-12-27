import { HttpException, HttpService, Injectable, Logger } from '@nestjs/common';
import { Airport } from './airport.class';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AirportAugmentation } from './airport-augmentation.entity';
import { AxiosResponse } from 'axios';

@Injectable()
export class AirportService {
  private readonly logger = new Logger(AirportService.name);

  constructor(private readonly http: HttpService,
              @InjectRepository(AirportAugmentation)
              private readonly augmentation: Repository<AirportAugmentation>) {
  }

  async getForICAO(icao: string): Promise<Airport> {
    const icaoCode = icao.toUpperCase();
    this.logger.log(`Searching for ICAO '${icaoCode}'`);

    let response: AxiosResponse;

    try {
      response = await this.http.get<any>(`https://ourairportapi.com/airport/${icaoCode}?expand=false`).toPromise();
      this.logger.debug(`Response status ${response.status} for airport request`);
    } catch (err) {
      this.logger.error(err);
      throw new HttpException(`Airport with ICAO '${icaoCode}' not found`, 404);
    }

    if (response.data.errorMessage || response.data.count > 1) {
      throw new HttpException(`Airport with ICAO '${icaoCode}' not found`, 404);
    }

    const augResult = await this.augmentation.findOne({ icao: icao });

    const foundAirport = response.data.results[0];
    return {
      icao: foundAirport.icao,
      type: foundAirport.type,
      name: foundAirport.name,
      lat: foundAirport.lat,
      lon: foundAirport.lon,
      elevation: foundAirport.elev,
      continent: foundAirport.continent,
      country: foundAirport.country,
      transAlt: augResult?.transAlt || NaN,
    };
  }
}
