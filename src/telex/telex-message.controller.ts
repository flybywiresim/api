import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { TelexService } from './telex.service';
import { TelexMessage, TelexMessageDto } from './telex-message.entity';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse, ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('TELEX')
@Controller('txmsg')
export class TelexMessageController {
  constructor(private telex: TelexService) {
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiSecurity('jwt')
  @ApiBody({ description: 'The message to send', type: TelexMessageDto })
  @ApiCreatedResponse({ description: 'The message could be addressed', type: TelexMessage })
  @ApiNotFoundResponse({ description: 'The sender or recipient flight number could not be found' })
  async sendNewMessage(@Body() body: TelexMessageDto, @Request() req): Promise<TelexMessage> {
    return await this.telex.sendMessage(body, req.user.connectionId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiSecurity('jwt')
  @ApiOkResponse({ description: 'Open messages for the recipient. Will get automatically acknowledged', type: [TelexMessage]})
  async getMessagesForConnection(@Request() req): Promise<TelexMessage[]> {
    return await this.telex.fetchMyMessages(req.user.connectionId, true);
  }

}
