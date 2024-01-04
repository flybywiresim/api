import { Body, CacheInterceptor, CacheTTL, Controller, Get, Post, UseInterceptors } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBody, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
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
    @ApiBody({
        description: 'The new connection containing the flight number and current location',
        type: CreateAocConnectionDto,
    })
    @ApiCreatedResponse({ description: 'An AOC connection got created', type: FlightToken })
    @ApiBadRequestResponse({ description: 'An active flight with the given flight number is already in use' })
    addNewConnection(@Body() body: CreateAocConnectionDto): Promise<FlightToken> {
        return this.aoc.addNewConnection(body);
    }
}
