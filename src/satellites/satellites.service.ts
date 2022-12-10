import { HttpService, Injectable, Logger } from '@nestjs/common';
import { map, tap } from 'rxjs/operators';
import { forkJoin, Observable } from 'rxjs';
import { SatelliteInfo } from './dto/satellite-info.dto';

@Injectable()
export class SatellitesService {
    private readonly logger = new Logger(SatellitesService.name);

    constructor(private readonly http: HttpService) {
    }

    public getSatellitesInfo(type: string): Observable<SatelliteInfo[]> {
        return forkJoin({
            jsonResponse: this.http.get<any>(`https://celestrak.com/NORAD/elements/gp.php?GROUP=${type}&FORMAT=json`),
            tleResponse: this.http.get<any>(`https://celestrak.com/NORAD/elements/gp.php?GROUP=${type}&FORMAT=tle`),
        }).pipe(
            tap((response) => this.logger.debug(`Response status ${response.jsonResponse.status} for Celestrak request`)),
            tap((response) => this.logger.debug(`Response status ${response.tleResponse.status} for Celestrak request`)),
            map((response) => [response.jsonResponse.data, response.tleResponse.data]),
            map((data) => {
                const satellites: SatelliteInfo[] = data[0].map((info) => ({
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
                    tleLineOne: '',
                    tleLineTwo: '',
                }));

                const tleData: string[] = data[1].split('\n');
                for (let i = 0; i < tleData.length; i += 3) {
                    const name = tleData[i].trim();
                    if (name.length === 0) continue;

                    const idx = satellites.findIndex((satellite) => satellite.name === name);
                    if (idx > -1) {
                        satellites[idx].tleLineOne = tleData[i + 1].trim();
                        satellites[idx].tleLineTwo = tleData[i + 2].trim();
                    } else {
                        this.logger.warn(`Unable to find ${name}, ${tleData[i]}`);
                    }
                }

                return satellites;
            }),
        );
    }
}
