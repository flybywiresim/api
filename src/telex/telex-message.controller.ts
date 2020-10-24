import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IpAddress } from '../ip-address.decorator';
import { TelexService } from './telex.service';
import { TelexMessage, TelexMessageDTO } from './telex-message.entity';

@Controller('txmsg')
export class TelexMessageController {
  constructor(private telex: TelexService) {
  }

  @Post()
  async addNewConnection(@Body() body: TelexMessageDTO, @IpAddress() ipAddress): Promise<TelexMessage> {
    return await this.telex.sendMessage(body, ipAddress);
  }

  @Get(':id')
  async getMessagesForId(@Param('id') id: string, @IpAddress() ipAddress): Promise<TelexMessage[]> {
    return await this.telex.fetchMyMessages(id, ipAddress, true);
  }

}