import { HttpService, Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { CacheService } from '../cache/cache.service';
import { MetarService } from './metar.service';

describe('MetarService', () => {
    let service: MetarService;
    const get = jest.fn();

    beforeEach(async () => {
        get.mockReset();
        jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MetarService,
                { provide: HttpService, useValue: { get } },
                { provide: CacheService, useValue: {} },
            ],
        }).compile();

        service = module.get<MetarService>(MetarService);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it.each([
        ['METAR EDDM 101050Z AUTO 24010KT 9999 BKN010 13/12 Q1015', 'EDDM', 'EDDM 101050Z AUTO 24010KT 9999 BKN010 13/12 Q1015'],
        ['METAR LFPG 101100Z 28012KT 9999 SCT026 16/07 Q1016 NOSIG', 'LFPG', 'LFPG 101100Z 28012KT 9999 SCT026 16/07 Q1016 NOSIG'],
        ['SPECI EDDM 101055Z 24010KT 4000 RA BKN008 13/12 Q1015', 'EDDM', 'EDDM 101055Z 24010KT 4000 RA BKN008 13/12 Q1015'],
        ['EDDM 101050Z 24010KT 9999 BKN010 13/12 Q1015', 'EDDM', 'EDDM 101050Z 24010KT 9999 BKN010 13/12 Q1015'],
        ['METAR EDDM 101050Z 24010KT 9999 BKN010 13/12 Q1015 $\n', 'EDDM', 'EDDM 101050Z 24010KT 9999 BKN010 13/12 Q1015'],
        ['METAR LFPG 101100Z 28012KT 9999 SCT026 16/07 Q1016\r\n  METAR EDDM 101050Z 24010KT 9999 BKN010 13/12 Q1015\r\n', 'eddm', 'EDDM 101050Z 24010KT 9999 BKN010 13/12 Q1015'],
    ])('should read AviationWeather report %s', async (data, icao, metar) => {
        get.mockReturnValue(of({ status: 200, data }));

        await expect(service.getForICAO(icao, 'aviationweather')).resolves.toEqual({ icao: icao.toUpperCase(), source: 'AviationWeather', metar });
        expect(get).toHaveBeenCalledWith(
            `https://aviationweather.gov/api/data/metar?hours=0&ids=${icao.toUpperCase()}`,
            { responseType: 'text' },
        );
    });

    it.each([
        '',
        'METAR LFPG 101100Z 28012KT 9999 SCT026 16/07 Q1016',
        'EDDMX 101050Z 24010KT 9999 BKN010 13/12 Q1015',
    ])('should reject a response without the requested station: %s', async (data) => {
        get.mockReturnValue(of({ status: 200, data }));

        await expect(service.getForICAO('EDDM', 'aviationweather')).rejects.toMatchObject({ status: 404, response: 'METAR not available for ICAO: EDDM' });
        expect(Logger.prototype.error).not.toHaveBeenCalledWith(expect.any(TypeError));
    });
});
