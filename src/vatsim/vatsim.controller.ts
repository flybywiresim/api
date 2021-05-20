import {
    CacheInterceptor,
    CacheTTL,
    Controller,
    Get,
    Param,
    Query,
    UseInterceptors,
} from '@nestjs/common';
import {
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiParam,
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger';
import { VatsimControl } from './vatsim.class';
import { VatsimService } from './vatsim.service';

@ApiTags('VATSIM')
@Controller('vatsim')
@UseInterceptors(CacheInterceptor)
export class VatsimController {
    constructor(private vatsim: VatsimService) {}

    @Get('atc')
    @CacheTTL(120)
    @ApiOkResponse({ description: 'list of connected vatsim atc', type: VatsimControl })
    async getControllers(): Promise<VatsimControl[]> {
        return this.vatsim.getControllers();
    }
}
