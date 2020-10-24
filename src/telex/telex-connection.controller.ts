import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { TelexConnection, TelexConnectionDto } from './telex-connection.entity';
import { IpAddress } from '../ip-address.decorator';
import { TelexService } from './telex.service';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('TELEX')
@Controller('txcxn')
export class TelexConnectionController {
  constructor(private telex: TelexService) {
  }

  @Get()
  @ApiOkResponse({ description: 'All active TELEX connections', type: [TelexConnection] })
  async getAllActiveConnections(): Promise<TelexConnection[]> {
    return await this.telex.getAllActiveConnections();
  }

  @Get(':id')
  @ApiParam({name: 'id', description: 'The connection ID', example: '6571f19e-21f7-4080-b239-c9d649347101'})
  @ApiOkResponse({ description: 'The connection with the given ID was found', type: TelexConnection })
  @ApiNotFoundResponse({ description: 'The connection with the given ID could not be found' })
  async getSingleConnection(@Param('id') id: string, @IpAddress() ipAddress): Promise<TelexConnection> {
    return await this.telex.getSingleConnection(id, ipAddress);
  }

  @Post()
  @ApiBody({ description: 'The new connection containing the flight number and current location', type: TelexConnectionDto })
  @ApiCreatedResponse({ description: 'The connection got registered', type: TelexConnection })
  @ApiBadRequestResponse({ description: 'An active flight with the given flight number is already in use' })
  async addNewConnection(@Body() body: TelexConnectionDto, @IpAddress() ipAddress): Promise<TelexConnection> {
    return await this.telex.addNewConnection(body, ipAddress);
  }

  @Put(':id')
  @ApiParam({name: 'id', description: 'The connection ID', example: '6571f19e-21f7-4080-b239-c9d649347101'})
  @ApiBody({ description: 'The updated connection containing the current location', type: TelexConnectionDto })
  @ApiOkResponse({ description: 'The connection got updated', type: TelexConnection })
  @ApiNotFoundResponse({ description: 'The connection with the given ID and IP could not be found' })
  async updateConnection(@Param('id') id: string, @Body() body: TelexConnectionDto, @IpAddress() ipAddress): Promise<TelexConnection> {
    return await this.telex.updateConnection(id, body, ipAddress);
  }

  @Delete(':id')
  @ApiParam({name: 'id', description: 'The connection ID', example: '6571f19e-21f7-4080-b239-c9d649347101'})
  @ApiOkResponse({ description: 'The connection got disabled' })
  @ApiNotFoundResponse({ description: 'The connection with the given ID and IP could not be found' })
  async disableConnection(@Param('id') id: string, @IpAddress() ipAddress): Promise<void> {
    return await this.telex.disableConnection(id, ipAddress);
  }
}