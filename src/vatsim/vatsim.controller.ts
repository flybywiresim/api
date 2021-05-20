import {
    CacheInterceptor,
    CacheTTL,
    Controller,
    Get,
    Param,
    Query,
    UseInterceptors,
} from '@nestjs/common';
import {
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiParam,
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger';
import { VatsimControl } from './vatsim.class';

const fetch = require('node-fetch');

@ApiTags('VATSIM')
@Controller('vatsim')
@UseInterceptors(CacheInterceptor)
export class VatsimController {
    constructor() {}

    convertType(callsign: string): string {
        if (callsign.indexOf('_CTR') > -1) {
            return 'Radar';
        }
        if (callsign.indexOf('_DEL') > -1) {
            return 'Delivery';
        }
        if (callsign.indexOf('_GND') > -1) {
            return 'Ground';
        }
        if (callsign.indexOf('_DEP') > -1) {
            return 'Departure';
        }
        if (callsign.indexOf('_APP') > -1) {
            return 'Approach';
        }
        if (callsign.indexOf('_TWR') > -1) {
            return 'Tower';
        }
        return 'Unknow';
    }

    getCenterOfCoordinates(array: any[]) {
        if (!array) {
            return null;
        }

        const numCoords = array.length;
        if (numCoords === 1) {
            return [array[0].latDeg, array[0].lonDeg];
        }

        let X = 0.0;
        let Y = 0.0;
        let Z = 0.0;

        for (let i = 0; i < numCoords; i++) {
            const lat = (array[i].latDeg * Math.PI) / 180;
            const lon = (array[i].lonDeg * Math.PI) / 180;
            const a = Math.cos(lat) * Math.cos(lon);
            const b = Math.cos(lat) * Math.sin(lon);
            const c = Math.sin(lat);

            X += a;
            Y += b;
            Z += c;
        }

        X /= numCoords;
        Y /= numCoords;
        Z /= numCoords;

        const lon = Math.atan2(Y, X);
        const hyp = Math.sqrt(X * X + Y * Y);
        const lat = Math.atan2(Z, hyp);

        const finalLat = (lat * 180) / Math.PI;
        const finalLng = (lon * 180) / Math.PI;

        return [finalLat, finalLng];
    }

    @Get('')
    async getControllers(): Promise<VatsimControl[]> {
        const data: any = await (
            await fetch('https://data.vatsim.net/v3/vatsim-data.json')
        ).json();

        const transceivers: any = await (
            await fetch('https://data.vatsim.net/v3/transceivers-data.json')
        ).json();

        const arr: VatsimControl[] = [];
        for (const c of data.controllers) {
            const trans = transceivers.find((t) => t.callsign === c.callsign);
            const position = this.getCenterOfCoordinates(trans?.transceivers);

            arr.push({
                callsign: c.callsign,
                frequency: c.frequency,
                textAtis: c.text_atis,
                visualRange: c.visual_range,
                type: this.convertType(c.callsign),
                latitude: position ? position[0] : null,
                longitude: position ? position[1] : null,
            });
        }

        return arr.filter((c) => c.type !== 'Unknow');
    }
}
