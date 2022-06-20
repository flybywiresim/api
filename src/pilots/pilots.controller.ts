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
import { PilotsInfo } from './pilots-info.class';
import { PilotsService } from './pilots.service';

@ApiTags('Pilots')
@Controller('api/v1/pilots')
@UseInterceptors(CacheInterceptor)
export class PilotsController {
    constructor(private pilotsService: PilotsService) {}

    @Get('')
    @CacheTTL(120)
    @ApiQuery({
        name: 'source',
        description: 'The source for the atcs',
        example: 'vatsim',
        required: true,
        enum: ['vatsim', 'ivao'],
    })
    @ApiOkResponse({ description: 'list of connected pilots', type: [PilotsInfo] })
    async getPilots(@Query('source') source?: string): Promise<PilotsInfo[]> {
        if (source === 'vatsim') {
            return this.pilotsService.getVatsimPilots();
        }
        if (source === 'ivao') {
            return this.pilotsService.getIvaoPilots();
        }
        return null;
    }
}
