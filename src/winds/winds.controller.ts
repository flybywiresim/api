import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiParam, ApiOkResponse } from '@nestjs/swagger';
import { Wind } from './dto/wind.dto';
import { WindsService } from './winds.service';

@ApiTags('WINDS')
@Controller('winds')
export class WindsController {
    constructor(private readonly windsService: WindsService) {}

  @Get()
    findAll() {
        return this.windsService.findAll();
    }

  @Get(':altitude/:lat/:lon/:datetime/:forecast')
  @ApiParam({ name: 'altitude', description: 'Alititude of winds aloft in feet', example: '25000' })
  @ApiParam({ name: 'lat', description: 'Latitude in decimal format', example: '53.174300' })
  @ApiParam({ name: 'lon', description: 'Longitude in decimal format', example: '-2.976000' })
  @ApiParam({ name: 'datetime', description: 'UTC datetime you want wind forecast for, as ISO 8601 string', example: new Date().toISOString() })
  @ApiParam({ name: 'forecast', description: 'Specify a time for the weather forecast from 0 to 384 hours (multiples of 3)', example: '0' })
  @ApiOkResponse({ description: 'Forecasted Winds calculated', type: Wind })
  getSingleWind(@Param('altitude') altitude: number, @Param('lat') lat: number, @Param('lon') lon: number, @Param('datetime') dt: string, @Param('forecast') forecast: number): Promise<Wind> {
      return this.windsService.getSingleWind(altitude, lat, lon, dt, forecast);
  }
}
