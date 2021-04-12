import { HttpException, HttpService, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AxiosResponse } from 'axios';
import { AirportAugmentation } from './airport-augmentation.entity';
import { CacheService } from '../cache/cache.service';
import { Airport } from './dto/airport.dto';
import { AirportBatchDto } from './dto/airport-batch.dto';

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

      const cacheHit = await this.cache.get<Airport>(`/api/v1/airport/${icao}`);
      const cacheError = await this.cache.get<boolean>(`upstream-error:/api/v1/airport/${icao}`);
      if (cacheError) {
          throw new HttpException(`Airport with ICAO '${icaoCode}' not found`, 404);
      }

      if (!cacheHit) {
          try {
              response = await this.http.get<any>(`https://ourairportapi.com/airport/${icaoCode}?expand=false`).toPromise();
              this.logger.debug(`Response status ${response.status} for airport request`);
          } catch (err) {
              this.logger.error(err);
              throw new HttpException(`Airport with ICAO '${icaoCode}' not found`, 404);
          }

          if (response.data.errorMessage || response.data.count > 1) {
              // Cache upstream 404s for 1 day
              this.cache.set(`upstream-error:/api/v1/airport/${icao}`, true, 86400).then(); // 1 day
              throw new HttpException(`Airport with ICAO '${icaoCode}' not found`, 404);
          }

          let augResult: AirportAugmentation | undefined;
          try {
              augResult = await this.augmentation.findOne({ icao });
          } catch (_) {
              this.logger.debug(`Airport with ICAO '${icao}' has no augmentation`);
          }

          const [foundAirport] = response.data.results;
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
          this.cache.set(`/api/v1/airport/${icao}`, augmentedAirport, 345600).then(); // 4 days

          return augmentedAirport;
      }
      return cacheHit;
  }

  async getBatch(icaos: AirportBatchDto): Promise<Airport[]> {
      const uniqueIcaos = [...new Set(icaos.icaos)];

      // eslint-disable-next-line consistent-return
      const res = await Promise.all(uniqueIcaos.map(async (icao) => {
          try {
              return await this.getForICAO(icao);
              // eslint-disable-next-line no-empty
          } catch (_) {}
      }));

      return res.filter((arpt) => arpt !== undefined);
  }
}
