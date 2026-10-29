import { Body, CacheInterceptor, CacheTTL, Controller, Delete, Get, Param, Post, Put, Query, Request, UseGuards, UseInterceptors, ValidationPipe } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBody, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiParam, ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AocService } from './aoc.service';
import { CreateAocConnectionDto } from './dto/create-aoc-connection.dto';
import { FlightToken } from '../auth/flights/flight-token.class';
import { PaginatedAocConnectionDto } from './dto/paginated-aoc-connection.dto';
import { PaginationDto } from '../common/Pagination';
import { BoundsDto } from '../common/Bounds';
import { AocConnectionSearchResultDto } from './dto/aoc-connection-search-result.dto';
import { AocConnection } from './entities/aoc-connection.entity';
import { FlightAuthGuard } from '../auth/flights/flight-auth-guard.service';
import { UpdateAocConnectionDto } from './dto/update-aoc-connection.dto';

@ApiTags('AOC')
@Controller('aoc')
@UseInterceptors(CacheInterceptor)
export class AocConnectionController {
    constructor(private aoc: AocService) {
    }

    @Get()
    @CacheTTL(15)
    @ApiOkResponse({ description: 'The paginated list of connections', type: PaginatedAocConnectionDto })
    @ApiQuery({
        name: 'take',
        type: Number,
        required: false,
        description: 'The number of connections to take',
        schema: { maximum: 25, minimum: 0, default: 25 },
    })
    @ApiQuery({
        name: 'skip',
        type: Number,
        required: false,
        description: 'The number of connections to skip',
        schema: { minimum: 0, default: 0 },
    })
    @ApiQuery({
        name: 'north',
        type: Number,
        required: false,
        description: 'Latitude for the north edge of the bounding box',
        schema: { minimum: -90, maximum: 90, default: 90 },
    })
    @ApiQuery({
        name: 'east',
        type: Number,
        required: false,
        description: 'Longitude for the east edge of the bounding box',
        schema: { minimum: -180, maximum: 180, default: 180 },
    })
    @ApiQuery({
        name: 'south',
        type: Number,
        required: false,
        description: 'Latitude for the south edge of the bounding box',
        schema: { minimum: -90, maximum: 90, default: -90 },
    })
    @ApiQuery({
        name: 'west',
        type: Number,
        required: false,
        description: 'Longitude for the west edge of the bounding box',
        schema: { minimum: -180, maximum: 180, default: -180 },
    })
    getAllActiveConnections(@Query(new ValidationPipe({ transform: true })) pagination: PaginationDto,
        @Query(new ValidationPipe({ transform: true })) bounds: BoundsDto): Promise<PaginatedAocConnectionDto> {
        return this.aoc.getActiveConnections(pagination, bounds);
    }

    @Get('_find')
    @CacheTTL(15)
    @ApiQuery({ name: 'flight', description: 'The flight number', example: 'AAL456' })
    @ApiOkResponse({ description: 'All connections matching the query', type: AocConnectionSearchResultDto })
    findConnection(@Query('flight') flight: string): Promise<AocConnectionSearchResultDto> {
        return this.aoc.findActiveConnectionByFlight(flight);
    }

    @Get('_count')
    @CacheTTL(15)
    @ApiOkResponse({ description: 'The total number of active AOC connections', type: Number })
    countConnections(): Promise<number> {
        return this.aoc.countActiveConnections();
    }

    @Get(':id')
    @CacheTTL(15)
    @ApiParam({ name: 'id', description: 'The connection ID', example: '6571f19e-21f7-4080-b239-c9d649347101' })
    @ApiOkResponse({ description: 'The connection with the given ID was found', type: AocConnection })
    @ApiNotFoundResponse({ description: 'The connection with the given ID could not be found' })
    getSingleConnection(@Param('id') id: string): Promise<AocConnection> {
        return this.aoc.getSingleConnection(id);
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

    @Put()
    @UseGuards(FlightAuthGuard)
    @ApiSecurity('jwt')
    @ApiBody({ description: 'The updated connection', type: UpdateAocConnectionDto })
    @ApiOkResponse({ description: 'The connection got updated', type: AocConnection })
    @ApiNotFoundResponse({ description: 'The connection with the given ID could not be found' })
    updateConnection(@Body() body: UpdateAocConnectionDto, @Request() req): Promise<AocConnection> {
        return this.aoc.updateConnection(req.user.connectionId, body);
    }

    @Delete()
    @UseGuards(FlightAuthGuard)
    @ApiSecurity('jwt')
    @ApiOkResponse({ description: 'The connection got disabled' })
    @ApiNotFoundResponse({ description: 'The connection with the given ID could not be found' })
    disableConnection(@Request() req): Promise<void> {
        return this.aoc.disableConnection(req.user.connectionId);
    }
}
