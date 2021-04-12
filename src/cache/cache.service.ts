import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
    constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

    public get<T>(key: string): Promise<T> {
        return this.cacheManager.get<T>(key);
    }

    public set(key: string, value: any, ttl: number): Promise<void> {
        return this.cacheManager.set(key, value, { ttl });
    }

    public del(key: string): Promise<void> {
        return this.cacheManager.del(key);
    }
}
