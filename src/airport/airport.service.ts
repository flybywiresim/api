import { HttpException, HttpService, Injectable, Logger } from '@nestjs/common';
import { Airport, AirportBatchDto } from './airport.class';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AirportAugmentation } from './airport-augmentation.entity';
import { AxiosResponse } from 'axios';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class AirportService {
  private readonly logger = new Logger(AirportService.name);

  constructor(private readonly http: HttpService,
              @InjectRepository(AirportAugmentation)
              private readonly augmentation: Repository<AirportAugmentation>,
              private readonly cache: CacheService) {
  }

  async getForICAO(icao: string): Promise<Airport> {
    const icaoCode = icao.toUpperCase();
    this.logger.log(`Searching for ICAO '${icaoCode}'`);

    let response: AxiosResponse;
    let foundAirport: any;

    const cacheHit = await this.cache.get<Airport>(`/api/v1/airport/${icao}`);
    if (!cacheHit) {
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

      foundAirport = response.data.results[0];
    } else {
      foundAirport = cacheHit;
    }

    let augResult: AirportAugmentation | undefined;
    try {
      augResult = await this.augmentation.findOne({ icao: icao });
    } catch (_) {}

    const augmentedAirport = {
      icao: foundAirport.icao,
      type: foundAirport.type,
      name: foundAirport.name,
      lat: foundAirport.lat,
      lon: foundAirport.lon,
      elevation: foundAirport.elev || foundAirport.elevation,
      continent: foundAirport.continent,
      country: foundAirport.country,
      transAlt: augResult?.transAlt || NaN,
    };
    this.cache.set(`/api/v1/airport/${icao}`, augmentedAirport, 86400);

    return augmentedAirport;
  }

  async getBatch(icaos: AirportBatchDto): Promise<Airport[]> {
    const res = await Promise.all(icaos.icaos.map(async icao => {
      try {
        return await this.getForICAO(icao);
      } catch (_) {}
    }));

    return res.filter(arpt => arpt !== undefined);
  }
}
