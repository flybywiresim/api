import { Injectable } from '@nestjs/common';
import { PilotsInfo } from './pilots-info.class';
import { VatsimService } from '../utilities/vatsim.service';
import { IvaoService } from '../utilities/ivao.service';

@Injectable()
export class PilotsService {
    constructor(private readonly vatsimService: VatsimService,
        private readonly ivaoService: IvaoService) { }

    public async getVatsimPilots(): Promise<PilotsInfo[]> {
        const data = await this.vatsimService.fetchVatsimData();
        const transceivers = await this.vatsimService.fetchVatsimTransceivers();

        const arr: PilotsInfo[] = [];
        for (const c of [...data.controllers, ...data.atis]) {
            if (this.callsignIsPilot(c.callsign)) {
                const trans = transceivers.find((t) => t.callsign === c.callsign);
                const position = this.getCenterOfCoordinates(trans?.transceivers);
                const altitude = this.getAltitude(trans?.transceivers);

                if (altitude && position) {
                    arr.push({
                        callsign: c.callsign,
                        altitude: this.getAltitude(trans?.transceivers),
                        latitude: position[0],
                        longitude: position[1],
                    });
                }
            }
        }

        return arr;
    }

    public async getIvaoPilots(): Promise<PilotsInfo[]> {
        const { clients: { pilots } } = await this.ivaoService.fetchIvaoData();

        return pilots.map((pilot) => ({
            callsign: pilot.callsign,
            altitude: pilot.lastTrack.altitude,
            latitude: pilot.lastTrack.latitude,
            longitude: pilot.lastTrack.longitude,
        }));
    }

    public callsignIsPilot(callsign: string): boolean {
        switch (callsign.split('_').reverse()[0]) {
        case 'CTR':
        case 'DEL':
        case 'GND':
        case 'DEP':
        case 'TWR':
        case 'APP':
        case 'ATIS':
        case 'OBS':
            return false;
        default:
            return true;
        }
    }

    public getAltitude(array: any[]) {
        if (array && array.length > 0 && array[0].heightAglM) {
            let altInString: string = array[0].heightAglM.toString();
            return Math.round(parseFloat(altInString));
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
