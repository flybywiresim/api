import { Injectable } from '@nestjs/common';
import { ATCInfo, AtcType } from './atc-info.class';
import { VatsimService } from '../utilities/vatsim.service';
import { IvaoService } from '../utilities/ivao.service';
import { PosconService } from '../utilities/poscon.service';

@Injectable()
export class AtcService {
    constructor(
        private readonly vatsimService: VatsimService,
        private readonly ivaoService: IvaoService,
        private readonly posconService: PosconService,
    ) {}

    public async getVatsimControllers(): Promise<ATCInfo[]> {
        const data = await this.vatsimService.fetchVatsimData();
        const transceivers = await this.vatsimService.fetchVatsimTransceivers();

        const arr: ATCInfo[] = [];
        for (const c of [...data.controllers, ...data.atis]) {
            const atcType = this.callSignToAtcType(c.callsign);
            if (atcType !== AtcType.UNKNOWN) {
                const trans = transceivers.find((t) => t.callsign === c.callsign);
                const position = this.getCenterOfCoordinates(trans?.transceivers);
                const freqency = trans ? this.getFrequency(trans?.transceivers) : c.frequency;

                if (freqency) {
                    arr.push({
                        callsign: c.callsign,
                        frequency: freqency,
                        textAtis: c.text_atis,
                        visualRange: c.visual_range,
                        type: this.callSignToAtcType(c.callsign),
                        latitude: position ? position[0] : null,
                        longitude: position ? position[1] : null,
                    });
                }
            }
        }

        // try to force ATIS location
        for (const c of arr.filter((i) => i.type === AtcType.ATIS && (!i.latitude || !i.longitude))) {
            const other = arr.find((o) => o.callsign.split('_')[0] === c.callsign.split('_')[0]);
            if (other) {
                c.latitude = other.latitude;
                c.longitude = other.longitude;
            }
        }
        return arr;
    }

    public async getIvaoControllers(): Promise<ATCInfo[]> {
        const { clients: { atcs } } = await this.ivaoService.fetchIvaoData();

        return atcs.map((atc) => ({
            callsign: atc.callsign,
            frequency: atc.atcSession.frequency.toString(),
            textAtis: atc.atis?.lines,
            latitude: atc.lastTrack.latitude,
            longitude: atc.lastTrack.longitude,
            type: this.callSignToAtcType(atc.callsign),
            // TODO FIXME: visual range is not currently available in the new IVAO Whazzup v2 data
            visualRange: 100,
        }));
    }

    public async getPosconControllers(): Promise<ATCInfo[]> {
        const data = await this.posconService.fetchPosconData();
        const atc: ATCInfo[] = [];
        data.atc.map((x): AtcType => {
            const [latitude, longitude] = x.centerPoint;
            return atc.push({
                callsign: x.telephony,
                frequency: x.vhfFreq,
                type: this.callSignToAtcType(x.type),
                latitude,
                longitude,
            });
        });
        return atc;
    }

    public callSignToAtcType(callsign: string): AtcType {
        switch (callsign.split('_').reverse()[0]) {
        case 'CTR': return AtcType.RADAR;
        case 'DEL': return AtcType.DELIVERY;
        case 'GND': return AtcType.GROUND;
        case 'DEP': return AtcType.DEPARTURE;
        case 'TWR': return AtcType.TOWER;
        case 'APP': return AtcType.APPROACH;
        case 'ATIS': return AtcType.ATIS;
        default: return AtcType.UNKNOWN;
        }
    }

    public getFrequency(array: any[]): string {
        if (array && array.length > 0 && array[0].frequency) {
            let freqInString: string = array[0].frequency.toString();
            freqInString = `${freqInString.substr(0, 3)}.${freqInString.substr(3)}`;
            return parseFloat(freqInString).toFixed(3);
        }
        return null;
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
