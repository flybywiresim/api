import { ApiProperty } from '@nestjs/swagger';

export class Wind {
  @ApiProperty({ description: 'The date time of the forecasted winds', example: '2021-10-02T12:00:00.000Z' })
  forecastTime: Date;

  @ApiProperty({ description: 'Forecasted wind altitude in feet', example: '25000' })
  altitude: number;

  @ApiProperty({ description: 'Forecasted wind latitude', example: '53' })
  lat: number;

  @ApiProperty({ description: 'Forecasted wind longitude', example: '53' })
  lon: number;

  @ApiProperty({ description: 'Forecasted temperature at given altitude in Kelvin', example: '231.82513510839325' })
  temp: number;

  @ApiProperty({ description: 'Forecasted wind speed in knots', example: '65' })
  windSpeed: number;

  @ApiProperty({ description: 'Forecasted wind direction in degress', example: '85' })
  windDirection: number;
}
