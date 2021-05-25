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
import { AtcService } from './atc.service';

@ApiTags('ATC')
@Controller('atc')
@UseInterceptors(CacheInterceptor)
export class AtcController {
    constructor(private atcService: AtcService) {}

    @Get('')
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
            return this.atcService.getVatsimControllers();
        }
        if (source === 'ivao') {
            return this.atcService.getIvaoControllers();
        }
        return null;
    }
}
