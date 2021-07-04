import {
    CacheInterceptor,
    CacheTTL,
    Controller,
    Get,
    Query,
    UseInterceptors,
} from '@nestjs/common';
import {
    ApiOkResponse,
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger';
import { PilotInfo } from './pilot-info.class';
import { PilotService } from './pilot.service';

@ApiTags('Pilot')
@Controller('api/v1/pilot')
@UseInterceptors(CacheInterceptor)
export class PilotController {
    constructor(private pilotService: PilotService) {}

    @Get('')
    @CacheTTL(60)
    @ApiQuery({
        name: 'source',
        description: 'The source for the pilots',
        example: 'vatsim',
        required: true,
        enum: ['vatsim', 'ivao'],
    })
    @ApiOkResponse({ description: 'list of connected pilot', type: [PilotInfo] })
    async getControllers(@Query('source') source?: string): Promise<PilotInfo[]> {
        if (source === 'vatsim') {
            return this.pilotService.getVatsimPilots();
        }
        if (source === 'ivao') {
            return this.pilotService.getIvaoPilots();
        }
        return null;
    }
}
