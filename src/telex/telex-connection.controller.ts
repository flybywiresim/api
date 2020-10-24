import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { TelexConnection, TelexConnectionDTO } from './telex-connection.entity';
import { IpAddress } from '../ip-address.decorator';
import { TelexService } from './telex.service';

@Controller('txcxn')
export class TelexConnectionController {
  constructor(private telex: TelexService) {
  }

  @Get()
  async getAllActiveConnections(): Promise<TelexConnection[]> {
    return await this.telex.getAllActiveConnections();
  }

  @Get(':id')
  async getSingleConnection(@Param('id') id: string, @IpAddress() ipAddress): Promise<TelexConnection> {
    return await this.telex.getSingleConnection(id, ipAddress);
  }

  @Post()
  async addNewConnection(@Body() body: TelexConnectionDTO, @IpAddress() ipAddress): Promise<TelexConnection> {
    return await this.telex.addNewConnection(body, ipAddress);
  }

  @Put(':id')
  async updateConnection(@Param('id') id: string, @Body() body: TelexConnectionDTO, @IpAddress() ipAddress): Promise<TelexConnection> {
    return await this.telex.updateConnection(id, body, ipAddress);
  }

  @Delete(':id')
  async disableConnection(@Param('id') id: string, @IpAddress() ipAddress): Promise<void> {
    return await this.telex.disableConnection(id, ipAddress);
  }
}