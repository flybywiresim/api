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
import { ATCInfo } from './atc-info.class';
import { VatsimService } from './vatsim.service';

@ApiTags('ONLINE')
@Controller('online')
@UseInterceptors(CacheInterceptor)
export class OnlineController {
    constructor(private vatsimService: VatsimService) {}

    @Get('atc')
    @CacheTTL(120)
    @ApiQuery({
        name: 'source',
        description: 'The source for the atcs',
        example: 'vatsim',
        required: true,
        enum: ['vatsim', 'ivao'],
    })
    @ApiOkResponse({ description: 'list of connected atc', type: ATCInfo })
    async getControllers(@Query('source') source?: string): Promise<ATCInfo[]> {
        if (source === 'vatsim') {
            return this.vatsimService.getControllers();
        }
        if (source === 'ivao') {
            return [];
        }
        return null;
    }
}
