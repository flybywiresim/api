import { Body, Controller, Post } from '@nestjs/common';
import {
    ApiBody,
    ApiCreatedResponse,
    ApiNotFoundResponse,
    ApiTags,
} from '@nestjs/swagger';
import { CpdlcService } from './cpdlc.service';
import { CpdlcMessageDto } from './dto/cpdlc-message.dto';
import { Cpdlc } from './cpdlc.class';

@ApiTags('CPDLC')
@Controller('cpdlc')
export class CpdlcController {
    constructor(private cpdlc: CpdlcService) {
    }

  @Post()
  @ApiBody({ description: 'The message to send', type: CpdlcMessageDto })
  @ApiCreatedResponse({ description: 'The message could be addressed', type: Cpdlc })
  @ApiNotFoundResponse({ description: 'The sender or recipient flight number could not be found' })
    async requestData(@Body() body: CpdlcMessageDto): Promise<Cpdlc> {
        return this.cpdlc.getData(body);
    }
}
