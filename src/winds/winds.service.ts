import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { createWriteStream } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { exit } from 'process';
import * as stream from 'stream';
import { promisify } from 'util';
import { Grib2sample } from './grib2-simple';

const fs = require('fs-extra');
const moment = require('moment-timezone');
const finished = promisify(stream.finished);


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

  hex2bin(hex) {
      return (parseInt(hex, 16).toString(2));
  }

  whatValue(row, c1, c2) {
      const bitLength = row.sections.section5.data.dataRepresentationTemplate.numberOfBitsForPacking;
      // const bitLength = 8;
      // console.log(row.sections.section7);
      // console.log(row.sections.section7.data.rawData);
      console.log("Section 5");
      console.log(row.sections.section5.data.dataRepresentationTemplate.R / c2);
      const string = this.hex2bin(row.sections.section7.data.rawData.toString('hex'));
      console.log(string);
      const splitBitsArray = string.match(new RegExp(`.{1,${bitLength}}`, 'g'));
      console.log('Split bits');
      console.log(splitBitsArray);
      const finalValue = splitBitsArray.map((x) => {
          if (x.length === bitLength) {
              const val = parseInt(x, 2);
              return (row.sections.section5.data.dataRepresentationTemplate.R + (val * c1)) / c2;
          }
          return null;
      });
      return finalValue;
  }

  processGribRows(row: any) {
      // console.log("--------------- Processing row ------------------");
      // console.log("-------------------------------------------------");
      // eslint-disable-next-line no-nested-ternary
      const variable = row.sections.section4.data.productDefinitionTemplate.parameterCategory === 0 ? 'TEMP'
          : (row.sections.section4.data.productDefinitionTemplate.parameterNumber === 2 ? 'UGRD'
              : 'VGRD');

      // console.log('Section 5');
      // console.log(row.sections.section5);
      const c1 = 2 ** row.sections.section5.data.dataRepresentationTemplate.E;
      const c2 = 10 ** row.sections.section5.data.dataRepresentationTemplate.D;

      // http://meteo.ieec.uned.es:8086/PFC_JMEstepa/documentos/GRIB.pdf

      const value = this.whatValue(row, c1, c2).filter(Number);
      // Looks like if there are only 3 elements in array, the lowest value is actually the first
      if (value.length === 3) {
          value.unshift(((row.sections.section5.data.dataRepresentationTemplate.R * c1) / c2));
      }

      const s4Template = row.sections.section4.data.productDefinitionTemplate;
      // Set default altitude of 100000 for tropopause
      const altitude = s4Template.firstfixedSurfaceType === 7 ? 100000 : s4Template.firstfixedValue / (10 ** s4Template.firstfixedScaleFactor) / 100;

      const result = {
          timestamp: row.sections.section1.data.referenceTimestamp,
          year: row.sections.section1.data.year,
          month: row.sections.section1.data.month,
          day: row.sections.section1.data.day,
          hour: row.sections.section1.data.hour,
          forecast: row.sections.section4.data.productDefinitionTemplate.forecastTime,
          mb: altitude,
          altitude: altitude === 100000 ? altitude : Math.round((145366.45 * (1 - ((altitude / 1013.25) ** 0.190284)))),
          variable,
          value,
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

          const grib2Array = Grib2sample.parseCompleteGrib2Buffer(fileContentBuffer);
          // Temp = 0 0
          // UGRD = 2 2
          // VGRD = 2 3
          const windArray: any[] = grib2Array.map(this.processGribRows, this);
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
    //   const response = await this.getResponse(0, altitude, lat, lon, datetime, forecast).then(() => this.readGrib2File());
    //   return response;

    this.readGrib2File();
  }
}
