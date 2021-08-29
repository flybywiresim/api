import { Injectable, Logger } from '@nestjs/common';
import { tmpdir } from 'os';
import { join } from 'path';
import { Grib2sample } from './grib2-simple';

const fs = require('fs-extra');

@Injectable()
export class WindsService {
  private readonly logger = new Logger(WindsService.name);

  findAll() {
      return 'This action returns all winds everywhere';
  }

  minMaxLatLon(lat: number, lon:number) {
      return [
          Math.floor(lat),
          Math.ceil(lat),
          Math.floor(lon),
          Math.ceil(lon),
      ];
  }

  nearestSix(dt: string) {
      const zeroPad = (num, places) => String(num).padStart(places, '0');

      const date = dt.substring(0, 10).replace(/-/g, '');
      // Will need to check if we are now looking at yesterday!
      const nextNearestDate = date;
      const nextNextNearestDate = date;
      const hour = parseInt(dt.substring(11, 13));
      const nearestForecastHour = Math.floor(hour / 6) * 6;
      const nextNearestForecastHour = nearestForecastHour - 6;
      const nextNextNearestForecastHour = nearestForecastHour - 12;
      return [
          date,
          nextNearestDate,
          nextNextNearestDate,
          zeroPad(nearestForecastHour, 2),
          zeroPad(nextNearestForecastHour, 2),
          zeroPad(nextNextNearestForecastHour, 2),
      ];
  }

  buildWindURLQuery(altitude: number, lat: number, lon: number, datetime: string) {
      const dateQuery = this.nearestSix(datetime);
      const latLonQuery = this.minMaxLatLon(lat, lon);
      const mB = Math.floor(this.altitudeToMb(altitude) / 50) * 50;
      // Everything except for the date
      // eslint-disable-next-line max-len
      const urlStem = `https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_1p00.pl?var_TMP=on&var_UGRD=on&var_VGRD=on&bottomlat=${latLonQuery[0]}&toplat=${latLonQuery[1]}&leftlon=${latLonQuery[2]}&rightlon=${latLonQuery[3]}&lev_${mB}_mb&dir=%2Fgfs.`;

      return [
          `${urlStem}${dateQuery[0]}%2F${dateQuery[3]}%2Fatmos&file=gfs.t${dateQuery[3]}z.pgrb2.1p00.anl`,
          `${urlStem}${dateQuery[1]}%2F${dateQuery[4]}%2Fatmos&file=gfs.t${dateQuery[4]}z.pgrb2.1p00.anl`,
          `${urlStem}${dateQuery[2]}%2F${dateQuery[5]}%2Fatmos&file=gfs.t${dateQuery[5]}z.pgrb2.1p00.anl`,
      ];
  }

  altitudeToMb(altitude: number) {
      const one = 1 - (6.87535 * 10 ** -6 * altitude);
      const two = one ** 5.2561;
      return (1013.25 * two);
  }

  getNumMembers (link: string) {
      return link.indexOf('ensemble') !== -1 ? 21 : 1;
  }

  async readGrib2File() {
      const dir = tmpdir();
      const filePath = join(dir, 'gfs.t12z.pgrb2.1p00.anl');
      // const filePath = join(dir, 'test.grib2');
      this.logger.debug(filePath);
      try {
        const fileContentBuffer = await fs.readFile(filePath);

        const grib2Array = Grib2sample.parseCompleteGrib2Buffer(fileContentBuffer);
      } catch (err) {
          this.logger.error(err);
      }

  }

  getSingleWind(altitude: number, lat: number, lon: number, datetime: string) {
      // Validate input
      // Get time to nearest 6 hours
      // Calculate 4 points of data
      const windUrl = this.buildWindURLQuery(altitude, lat, lon, datetime);
      this.readGrib2File();

      return `You want the wind for ${altitude}ft and lat/lon ${lat}/${lon} at datetime: ${datetime} and you'll get it with the following query: 
        ${windUrl[0]}
        ${windUrl[1]}
        ${windUrl[2]}`;
  }
}
