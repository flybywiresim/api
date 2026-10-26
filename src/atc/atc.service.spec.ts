import { AtcService } from './atc.service';
import { VatsimService } from '../utilities/vatsim.service';
import { IvaoService } from '../utilities/ivao.service';
import { AtcType } from './atc-info.class';

describe('AtcService', () => {
    const controller = (callsign: string, lastTrack: unknown, atcSession: unknown = { frequency: 118.3, position: 'TWR' }) => ({
        callsign,
        lastTrack,
        atcSession,
    });

    const serviceWithIvaoControllers = (atcs: unknown[]) => {
        const ivaoService = { fetchIvaoData: jest.fn().mockResolvedValue({ clients: { atcs } }) };

        return new AtcService({} as VatsimService, ivaoService as unknown as IvaoService);
    };

    describe('getIvaoControllers', () => {
        it('maps controllers with position and session data', async () => {
            const service = serviceWithIvaoControllers([
                controller('EDDM_TWR', { latitude: 48.35, longitude: 11.78 }),
            ]);

            await expect(service.getIvaoControllers()).resolves.toEqual([
                {
                    callsign: 'EDDM_TWR',
                    frequency: '118.3',
                    textAtis: undefined,
                    latitude: 48.35,
                    longitude: 11.78,
                    type: AtcType.TOWER,
                    visualRange: 100,
                },
            ]);
        });

        it('skips controllers without position or session data instead of failing', async () => {
            const service = serviceWithIvaoControllers([
                controller('EDDM_GND', null),
                controller('EDDM_APP', { latitude: 48.35, longitude: 11.78 }, null),
                controller('EDDM_TWR', { latitude: 48.35, longitude: 11.78 }),
            ]);

            const controllers = await service.getIvaoControllers();

            expect(controllers.map((c) => c.callsign)).toEqual(['EDDM_TWR']);
        });
    });
});
