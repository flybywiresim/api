import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IpAddress } from '../ip-address.decorator';
import { TelexService } from './telex.service';
import { TelexMessage, TelexMessageDto } from './telex-message.entity';
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
@Controller('txmsg')
export class TelexMessageController {
  constructor(private telex: TelexService) {
  }

  @Post()
  @ApiBody({ description: 'The message to send', type: TelexMessageDto })
  @ApiCreatedResponse({ description: 'The message could be addressed', type: TelexMessage })
  @ApiNotFoundResponse({ description: 'The sender or recipient flight number could not be found' })
  @ApiBadRequestResponse({ description: 'The given flight number is not associated with the sender IP' })
  async sendNewMessage(@Body() body: TelexMessageDto, @IpAddress() ipAddress): Promise<TelexMessage> {
    return await this.telex.sendMessage(body, ipAddress);
  }

  @Get(':id')
  @ApiParam({name: 'id', description: 'The connection ID', example: '6571f19e-21f7-4080-b239-c9d649347101'})
  @ApiOkResponse({ description: 'The recipient has open messages which got acknowledged now', type: [TelexMessage] })
  @ApiNotFoundResponse({ description: 'The recipient has no open messages' })
  async getMessagesForId(@Param('id') id: string, @IpAddress() ipAddress): Promise<TelexMessage[]> {
    return await this.telex.fetchMyMessages(id, ipAddress, true);
  }

}