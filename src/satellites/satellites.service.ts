import { HttpService, Injectable, Logger } from '@nestjs/common';
import { map, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { SatelliteInfo } from './dto/satellite-info.dto';

@Injectable()
export class SatellitesService {
    private readonly logger = new Logger(SatellitesService.name);

    constructor(private readonly http: HttpService) {
    }

    private getSatellitesInfo(group: string): Observable<SatelliteInfo[]> {
        return this.http.get<any>(`https://celestrak.com/NORAD/elements/gp.php?GROUP=${group}&FORMAT=json`)
            .pipe(
                tap((response) => this.logger.debug(`Response status ${response.status} for Celestrak request`)),
                map((response) => response.data),
                map((data) => data.map((info) => ({
                    name: info.OBJECT_NAME,
                    id: info.OBJECT_ID,
                    epoch: new Date(info.EPOCH),
                    meanMotion: info.MEAN_MOTION,
                    eccentricity: info.ECCENTRICITY,
                    inclination: info.INCLINATION,
                    raOfAscNode: info.RA_OF_ASC_NODE,
                    argOfPericenter: info.ARG_OF_PERICENTER,
                    meanAnomaly: info.MEAN_ANOMALY,
                    ephemerisType: info.EPHEMERIS_TYPE,
                    classificationType: info.CLASSIFICATION_TYPE,
                    noradCatId: info.NORAD_CAT_ID,
                    elementSetNo: info.ELEMENT_SET_NO,
                    revAtEpoch: info.REV_AT_EPOCH,
                    bstar: info.BSTAR,
                    meanMotionDot: info.MEAN_MOTION_DOT,
                    meanMotionDdot: info.MEAN_MOTION_DDOT,
                }))),
            );
    }

    public getGnssInfo(): Observable<SatelliteInfo[]> {
        return this.getSatellitesInfo('gnss');
    }

    public getIridiumInfo(): Observable<SatelliteInfo[]> {
        return this.getSatellitesInfo('iridium');
    }
}
