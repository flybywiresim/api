import {
    HttpException,
    HttpService,
    Injectable, Logger,
} from '@nestjs/common';
import { catchError, map, tap } from 'rxjs/operators';
import { Cpdlc } from './cpdlc.class';
import { CacheService } from '../cache/cache.service';
import { CpdlcMessageDto } from './dto/cpdlc-message.dto';

@Injectable()
export class CpdlcService {
  private readonly logger = new Logger(CpdlcService.name);

  constructor(private http: HttpService,
              private readonly cache: CacheService) {
  }

  async getData(dto: CpdlcMessageDto): Promise<Cpdlc> {
      const packet = `${dto.packet !== undefined ? `&packet=${encodeURIComponent(dto.packet)}`: ''}`;
      return this.http.get<string>(`http://www.hoppie.nl/acars/system/connect.html?logon=${dto.logon}&from=${dto.from}&to=${dto.to}&type=${dto.type}${packet}`)
          .pipe(
              map((response) => {
                  if (!response.data) {
                      throw this.generateNotAvailableException('Empty response');
                  }

                  return { response: response.data };
              }),
              catchError(
                  (err) => {
                      throw this.generateNotAvailableException(err);
                  },
              ),
          ).toPromise();
  }

  private generateNotAvailableException(err: any): HttpException {
      const exception = new HttpException('error {}', 404);
      this.logger.error(err);
      this.logger.error(exception);
      return exception;
  }
}
