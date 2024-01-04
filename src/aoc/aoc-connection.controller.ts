import { Body, CacheInterceptor, CacheTTL, Controller, Get, Post, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AocService } from './aoc.service';
import { CreateAocConnectionDto } from './dto/create-aoc-connection.dto';
import { FlightToken } from '../auth/flights/flight-token.class';

@ApiTags('AOC')
@Controller('aoc')
@UseInterceptors(CacheInterceptor)
export class AocConnectionController {
    constructor(private aoc: AocService) {
    }

    @Get('_count')
    @CacheTTL(15)
    @ApiOkResponse({ description: 'The total number of active AOC connections', type: Number })
    countConnections(): Promise<number> {
        return this.aoc.countActiveConnections();
    }

    @Post()
    addNewConnection(@Body() body: CreateAocConnectionDto): Promise<FlightToken> {
        return this.aoc.addNewConnection(body);
    }
}
