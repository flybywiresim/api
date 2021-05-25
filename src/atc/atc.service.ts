import { Injectable } from '@nestjs/common';
import { IvaoService } from 'src/utilities/ivao.service';
import { VatsimService } from 'src/utilities/vatsim.service';
import { ATCInfo, AtcType } from './atc-info.class';

@Injectable()
export class AtcService {
    constructor(private readonly vatsimService: VatsimService, private readonly ivaoService: IvaoService) {}

    public async getVatsimControllers(): Promise<ATCInfo[]> {
        const data = await this.vatsimService.fetchVatsimData();
        const transceivers = await this.vatsimService.fetchVatsimTransceivers();

        const arr: ATCInfo[] = [];
        for (const c of data.controllers) {
            const atcType = this.callSignToAtcType(c.callsign);
            if (atcType !== AtcType.unknow) {
                const trans = transceivers.find((t) => t.callsign === c.callsign);
                const position = this.getCenterOfCoordinates(trans?.transceivers);

                arr.push({
                    callsign: c.callsign,
                    frequency: c.frequency,
                    textAtis: c.text_atis,
                    visualRange: c.visual_range,
                    type: this.callSignToAtcType(c.callsign),
                    latitude: position ? position[0] : null,
                    longitude: position ? position[1] : null,
                });
            }
        }

        return arr;
    }

    public async getIvaoControllers(): Promise<ATCInfo[]> {
        const data = await this.ivaoService.fetchIvaoData();

        const arr: ATCInfo[] = [];
        for (const c of data) {
            if (c.indexOf(':ATC:') > -1) {
                const split = c.split(':');
                if (split[0].indexOf('_') > -1) {
                    const atisLine = data.find((x) => x.startsWith(`${split[0].split('_')[0]}_TWR`));
                    const atis = atisLine?.split(':')[35]
                        .split('^§')
                        .slice(1)
                        .join(' ')
                        .toUpperCase();

                    arr.push({
                        callsign: split[0],
                        frequency: split[4],
                        textAtis: atis ? [atis] : null,
                        visualRange: parseInt(split[19]),
                        type: this.callSignToAtcType(split[0]),
                        latitude: parseFloat(split[5]),
                        longitude: parseFloat(split[6]),
                    });
                }
            }
        }

        return arr.filter((c) => c.type !== AtcType.unknow);
    }

    public callSignToAtcType(callsign: string): AtcType {
        if (callsign.indexOf('_CTR') > -1) {
            return AtcType.radar;
        }
        if (callsign.indexOf('_DEL') > -1) {
            return AtcType.delivery;
        }
        if (callsign.indexOf('_GND') > -1) {
            return AtcType.ground;
        }
        if (callsign.indexOf('_DEP') > -1) {
            return AtcType.departure;
        }
        if (callsign.indexOf('_APP') > -1) {
            return AtcType.approach;
        }
        if (callsign.indexOf('_TWR') > -1) {
            return AtcType.tower;
        }
        return AtcType.unknow;
    }

    public getCenterOfCoordinates(array: any[]) {
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
}
