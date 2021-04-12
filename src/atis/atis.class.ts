import { ApiProperty } from '@nestjs/swagger';

export class Atis {
  @ApiProperty({ description: 'The airport ICAO', example: 'KLAX' })
  icao: string;

  @ApiProperty({ description: 'The source of the ATIS notice', enum: ['faa', 'vatsim', 'ivao', 'pilotedge'] })
  source: string;

  @ApiProperty({
      description: 'The combined ATIS notice',
      example: 'KLAX ATIS INFO V 2253Z. 25012KT 10SM FEW025 SCT043 BKN240 20/12 A2993 (TWO NINER NINER THREE). '
      + 'SIMUL ILS APPS IN PROG RWYS 24R AND 25L, OR VCTR FOR VIS APP WILL BE PROVIDED. SIMUL VIS APPS TO ALL RWYS '
      + 'ARE IN PROG. PARALLEL APPS IN PROG BTWN LOS ANGELES AND HAWTHORNE ARPTS. SIMUL INSTRUMENT DEPS IN PROG '
      + 'RWYS 24 AND 25. NOTAMS... ASDE-X SYSTEM IN USE. ACTIVATE TRANSPONDER WITH MODE C ON ALL TWYS AND RWYS.'
      + ' READBACK ALL RWY HOLD SHORT INSTRUCTIONS. ...ADVS YOU HAVE INFO V.',
  })
  combined?: string;

  @ApiProperty({ description: 'The arrival ATIS notice' })
  arr?: string;

  @ApiProperty({ description: 'The departure ATIS notice' })
  dep?: string;
}
