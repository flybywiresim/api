import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import {
    ApiBody,
    ApiCreatedResponse,
    ApiNotFoundResponse,
    ApiOkResponse, ApiSecurity,
    ApiTags,
} from '@nestjs/swagger';
import { TelexService } from './telex.service';
import { TelexMessage } from './entities/telex-message.entity';
import { FlightAuthGuard } from '../auth/flights/flight-auth-guard.service';
import { TelexMessageDto } from './dto/telex-message.dto';
import { IpAddress } from '../utilities/ip-address.decorator';

@ApiTags('TELEX')
@Controller('txmsg')
export class TelexMessageController {
    constructor(private telex: TelexService) {
    }

  @Post()
  @UseGuards(FlightAuthGuard)
  @ApiSecurity('jwt')
  @ApiBody({ description: 'The message to send', type: TelexMessageDto })
  @ApiCreatedResponse({ description: 'The message could be addressed', type: TelexMessage })
  @ApiNotFoundResponse({ description: 'The sender or recipient flight number could not be found' })
    async sendNewMessage(@Body() body: TelexMessageDto, @Request() req, @IpAddress() userIp): Promise<TelexMessage> {
        return this.telex.sendMessage(body, req.user.connectionId, userIp);
    }

  @Get()
  @UseGuards(FlightAuthGuard)
  @ApiSecurity('jwt')
  @ApiOkResponse({ description: 'Open messages for the recipient. Will get automatically acknowledged', type: [TelexMessage] })
  async getMessagesForConnection(@Request() req): Promise<TelexMessage[]> {
      return this.telex.fetchMyMessages(req.user.connectionId, true);
  }
}
