import { ApiProperty } from '@nestjs/swagger';

export class FlightToken {
  @ApiProperty({ description: 'The access token for secured endpoints' })
  accessToken: string;

  @ApiProperty({ description: 'The connection ID the token refers to', example: '2a883a5c-b1f3-4a16-9fa4-b10515742d63' })
  connection: string;

  @ApiProperty({ description: 'The flight number the token refers to', example: 'OS 41' })
  flight: string;
}
