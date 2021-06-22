import { Injectable } from '@nestjs/common';
import { IvaoService } from 'src/utilities/ivao.service';
import { VatsimService } from 'src/utilities/vatsim.service';
import { PilotInfo } from './pilot-info.class';

@Injectable()
export class PilotService {
    constructor(private readonly vatsimService: VatsimService, private readonly ivaoService: IvaoService) {}

    public async getVatsimPilots(): Promise<PilotInfo[]> {
        const data = await this.vatsimService.fetchVatsimData();
        const arr: PilotInfo[] = [];
        for (const p of data.pilots) {
            arr.push({
                callsign: p.callsign,
                aircraft: p.flight_plan?.aircraft,
                arrival: p.flight_plan?.arrival,
                departure: p.flight_plan?.departure,
                heading: p.heading,
                altitude: p.altitude,
                groundspeed : p.groundspeed,
                name : p.name,
                latitude: p.latitude,
                longitude: p.longitude
            });   
        }
        return arr;
    }

    public async getIvaoPilots(): Promise<PilotInfo[]> {
        return [];
    }

    
   

}
