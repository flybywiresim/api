import { HttpService, Injectable, Logger } from '@nestjs/common';
import { map, tap } from 'rxjs/operators';
import { CacheService } from '../cache/cache.service';

type Client = {
    time: number;
    id: number;
    userId: number;
    callsign: string;
    serverId: string;
    softwareVersion: string;
    softwareTypeId: string;
    rating: number;
    lastTrack: {
        altitude: number;
        altitudeDifference: number;
        arrivalDistance: number | null;
        departureDistance: number | null;
        groundSpeed: number;
        heading: number;
        latitude: number;
        longitude: number;
        onGround: boolean;
        state: null;
        time: number;
        timestamp: string;
        transponder: number;
        transponderMode: string;
    };
    atcSession: {
        frequency: number;
        position: string;
    };
    createdAt: string;
}

type Server = {
    id: string;
    hostname: string;
    ip: string;
    description: string;
    countryId: string;
    currentConnections: number;
    maximumConnections: number;
}

type Atis = {
    lines: string[];
    callsign: string;
    revision: number;
    timestamp: string;
    sessionId: number;
}

interface Whazzup {
    updatedAt: string;
    servers: Server[];
    voiceServers: Server[];
    clients: {
        atcs: Client[];
        followMe: unknown[];
        observers: Client[];
        pilots: Client[];
    };
    connections: {
        atc: number;
        observer: number;
        pilot: number;
        supervisor: number;
        total: number;
        worldTour: number;
    };
}

interface AtisMergedWhazzup extends Whazzup {
    clients: {
        atcs: (Client & { atis?: Atis })[];
        followMe: unknown[];
        observers: Client[];
        pilots: Client[];
    }
}

type WhazzupAtis = Atis[];

@Injectable()
export class IvaoService {
    private readonly logger = new Logger(IvaoService.name);

    constructor(
        private http: HttpService,
        private readonly cache: CacheService,
    ) { }

    public async fetchIvaoData(): Promise<AtisMergedWhazzup> {
        const cacheHit = await this.cache.get<AtisMergedWhazzup>('/ivao/data');

        if (cacheHit) {
            this.logger.debug('Returning from cache');
            return cacheHit;
        }

        const whazzupData: Whazzup = await this.http.get('https://api.ivao.aero/v2/tracker/whazzup')
            .pipe(
                tap((response) => this.logger.debug(`Response status ${response.status} for IVAO  request`)),
                tap((response) => this.logger.debug(`Response contains ${response.data.length} entries`)),
                map((response) => response.data),
            ).toPromise();

        const whazzupAtisData: WhazzupAtis = await this.http.get('https://api.ivao.aero/v2/tracker/whazzup/atis')
            .pipe(
                tap((response) => this.logger.debug(`Response status ${response.status} for IVAO  request`)),
                tap((response) => this.logger.debug(`Response contains ${response.data.length} entries`)),
                map((response) => response.data),
            ).toPromise();

        for (const atis of whazzupAtisData) {
            const atcWithSameCallsign = (whazzupData as AtisMergedWhazzup).clients.atcs.find((atcs) => atcs.callsign === atis.callsign);

            if (atcWithSameCallsign) {
                atcWithSameCallsign.atis = atis;
            }
        }

        this.cache.set('/ivao/data', whazzupData, 120).then();
        return whazzupData;
    }
}
