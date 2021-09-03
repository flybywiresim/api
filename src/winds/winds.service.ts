import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { createWriteStream } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import * as stream from 'stream';
import { promisify } from 'util';
import { Grib2sample } from './grib2-simple';

const fs = require('fs-extra');
const moment = require('moment-timezone');

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

  zeroPad(num, places) {
      return String(num).padStart(places, '0');
  }

  nearestSix(dt: string) {
      const date = dt.substring(0, 10).replace(/-/g, '');
      const hour = parseInt(dt.substring(11, 13));
      const nearestForecastHour = Math.floor(hour / 6) * 6;
      const lzForecastHour = this.zeroPad(nearestForecastHour, 2);
      return [
          date,
          lzForecastHour,
      ];
  }

  buildWindURLQuery(altitude: number, lat: number, lon: number, datetime: string, forecastHours: number) {
      const fh = forecastHours % 3 === 0 && forecastHours > 0 && forecastHours <= 384 ? forecastHours : 0;
      const paddedForecastHours = this.zeroPad(fh, 3);
      const dateQuery = this.nearestSix(datetime);
      const latLonQuery = this.minMaxLatLon(lat, lon);
      const mB = Math.floor(this.altitudeToMb(altitude) / 50) * 50;
      // eslint-disable-next-line max-len
      const urlStem = `https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p50.pl?file=gfs.t12z.pgrb2full.0p50.f${paddedForecastHours}&var_TMP=on&var_UGRD=on&var_VGRD=on&bottomlat=${latLonQuery[0]}&toplat=${latLonQuery[1]}&leftlon=${latLonQuery[2]}&rightlon=${latLonQuery[3]}&lev_${mB}_mb&dir=%2Fgfs.`;

      return [
          `${urlStem}${dateQuery[0]}%2F${dateQuery[1]}%2Fatmos`,
          datetime,
      ];
  }

  altitudeToMb(altitude: number) {
      const one = 1 - (6.87535 * 10 ** -6 * altitude);
      const two = one ** 5.2561;
      return (1013.25 * two);
  }

  getNumMembers(link: string) {
      return link.indexOf('ensemble') !== -1 ? 21 : 1;
  }

  async readGrib2File() {
      const dir = tmpdir();
      const filePath = join(dir, 'winds.anl');
      // const filePath = join(dir, 'test.grib2');
      this.logger.debug(filePath);
      try {
          const fileContentBuffer = await fs.readFile(filePath);

          const grib2Array = Grib2sample.parseCompleteGrib2Buffer(fileContentBuffer);
          // Wind = 0 0
          // UGRD = 2 2
          // VGRD = 2 3

          console.log(grib2Array[0].sections.section1.data); // Details of when the forecast was made.
          console.log(grib2Array[0].sections.section5.data); // Value
          console.log(grib2Array[0].sections.section4.data);
          console.log(grib2Array[1].sections.section5.data); // Value
          console.log(grib2Array[1].sections.segrib2Array);
          console.log(grib2Array[2].sections.section5.data); // Value
          console.log(grib2Array[2].sections.segrib2Array);
      } catch (err) {
          this.logger.error(err);
      }
  }

  async getResponse(count: number, altitude: number, lat: number, lon: number, datetime: string, forecast: number): Promise<any> {
      const windUrl = this.buildWindURLQuery(altitude, lat, lon, datetime, forecast);
      const dir = tmpdir();
      const fileName = join(dir, 'winds.anl');

      await axios(
          {
              method: 'get',
              url: windUrl[0],
              responseType: 'stream',
          },
      ).then((response) => {
          if (response.status === 200) {
              response.data.pipe(fs.createWriteStream(fileName));
          } else {
              throw new Error('URL not valid');
          }
      }).catch(() => {
          if (count++ < 4) {
              // Calculate date 6 hours before current one.
              const sixHoursEarlier = moment(windUrl[1]).subtract(6, 'hours').toISOString();
              return this.getResponse(count, altitude, lat, lon, sixHoursEarlier, forecast);
          }
          throw new Error('max retries reached');
      });
  }

  async getSingleWind(altitude: number, lat: number, lon: number, datetime: string, forecast: number) {
    //   const response = await this.getResponse(0, altitude, lat, lon, datetime, forecast).then(async (response) => {
    //       this.readGrib2File();
    //   });

    this.readGrib2File();

      //return response;
  }
}
