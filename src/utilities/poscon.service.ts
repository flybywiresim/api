import { HttpService, Injectable, Logger } from '@nestjs/common';
import { map, tap } from 'rxjs/operators';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class PosconService {
    private readonly logger = new Logger(PosconService.name);

    constructor(
        private http: HttpService,
        private readonly cache: CacheService,
    ) {
    }

    public async fetchPosconData(): Promise<any> {
        const cacheHit = await this.cache.get('/poscon/data');

        if (cacheHit) {
            this.logger.debug('Returning from cache');
            return cacheHit;
        }
        const data = await this.http.get<any>('https://hqapi.poscon.net/online.json')
            .pipe(
                tap((response) => this.logger.debug(`Response status ${response.status} for POSCON request`)),
                map((response) => response.data),
            )
            .toPromise();

        this.cache.set('/poscon/data', data, 120)
            .then();
        return data;
    }
}
