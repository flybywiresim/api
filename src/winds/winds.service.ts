import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { tmpdir } from 'os';
import { join } from 'path';
import * as stream from 'stream';
import { promisify } from 'util';
import { GRIB, GRIBPacket } from 'vgrib2';

const fs = require('fs-extra');
const moment = require('moment-timezone');

const finished = promisify(stream.finished);

type gribArray = {
    lat: number,
    lon: number,
    value: number,
}

type processGribType = {
    forecastTime: Date,
    mb: number,
    altitude: number,
    data: Array<gribArray>,
    valueType: string,
    valueUnit: string,
  }

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
      const mbLow = Math.floor(this.altitudeToMb(altitude) / 50) * 50;
      const mbHigh = Math.ceil(this.altitudeToMb(altitude) / 50) * 50;
      // eslint-disable-next-line max-len
      const urlStem = `https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_1p00.pl?file=gfs.t${dateQuery[1]}z.pgrb2.1p00.f${paddedForecastHours}&var_TMP=on&var_UGRD=on&var_VGRD=on&subregion=&bottomlat=${latLonQuery[0]}&toplat=${latLonQuery[1]}&leftlon=${latLonQuery[2]}&rightlon=${latLonQuery[3]}&lev_${mbHigh}_mb&lev_${mbLow}_mb&dir=%2Fgfs.`;

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

  processGribRows(row: GRIBPacket) {
      const result = {
          forecastTime: row.productDefinition.forecastTime,
          mb: row.productDefinition.surface1.value / 100,
          altitude: Math.round((145366.45 * (1 - (((row.productDefinition.surface1.value / 100) / 1013.25) ** 0.190284)))),
          data: [
              { lat: row.gridDefinition.la1, lon: row.gridDefinition.lo1 > 180 ? row.gridDefinition.lo1 - 360 : row.gridDefinition.lo1, value: row.data[0] },
              { lat: row.gridDefinition.la1, lon: row.gridDefinition.lo2 > 180 ? row.gridDefinition.lo2 - 360 : row.gridDefinition.lo2, value: row.data[1] },
              { lat: row.gridDefinition.la2, lon: row.gridDefinition.lo1 > 180 ? row.gridDefinition.lo1 - 360 : row.gridDefinition.lo1, value: row.data[2] },
              { lat: row.gridDefinition.la2, lon: row.gridDefinition.lo2 > 180 ? row.gridDefinition.lo2 - 360 : row.gridDefinition.lo2, value: row.data[3] },
          ],
          valueType: row.productDefinition.paramater.abbrev,
          valueUnit: row.productDefinition.paramater.units,
      };
      return result;
  }

  async readGrib2File() {
      const dir = tmpdir();
      const filePath = join(dir, 'winds.anl');
      // const filePath = join(dir, 'test.grib2');
      this.logger.debug(filePath);
      try {
          const fileContentBuffer = await fs.readFile(filePath);
          const grib = GRIB.parse(fileContentBuffer);
          const windArray: Array<processGribType> = grib.map(this.processGribRows, this);
          console.log('Wind Array is:');
          console.log(windArray);
          return windArray;
      } catch (err) {
          this.logger.error(err);
          return [err];
      }
  }

  async getResponse(count: number, altitude: number, lat: number, lon: number, datetime: string, forecast: number): Promise<any> {
      const windUrl = this.buildWindURLQuery(altitude, lat, lon, datetime, forecast);
      const dir = tmpdir();
      const fileName = join(dir, 'winds.anl');
      const writer = fs.createWriteStream(fileName);

      await axios(
          {
              method: 'get',
              url: windUrl[0],
              responseType: 'stream',
          },
      ).then((response) => {
          if (response.status === 200) {
              response.data.pipe(writer);
              return finished(writer);
          }
          throw new Error('URL not valid');
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
      // const response = await this.getResponse(0, altitude, lat, lon, datetime, forecast).then(() => this.readGrib2File());
      // return response;

      this.readGrib2File();
  }
}
