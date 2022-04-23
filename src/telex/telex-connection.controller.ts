import {
    Body, CacheInterceptor, CacheTTL,
    Controller,
    Delete,
    Get, HttpException,
    Param,
    Post,
    Put,
    Query,
    Request,
    UseGuards, UseInterceptors,
    ValidationPipe,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBody,
    ApiCreatedResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiParam, ApiQuery, ApiSecurity,
    ApiTags,
} from '@nestjs/swagger';
import { TelexConnection } from './entities/telex-connection.entity';
import { TelexService } from './telex.service';
import { FlightToken } from '../auth/flights/flight-token.class';
import { FlightAuthGuard } from '../auth/flights/flight-auth-guard.service';
import { BoundsDto } from '../common/Bounds';
import { PaginationDto } from '../common/Pagination';
import { PaginatedTelexConnectionDto } from './dto/paginated-telex-connection.dto';
import { TelexSearchResult } from './dto/telex-search-result.dto';
import { CreateTelexConnectionDto } from './dto/create-telex-connection.dto';
import { UpdateTelexConnectionDto } from './dto/update-telex-connection.dto';

@ApiTags('TELEX')
@Controller('txcxn')
@UseInterceptors(CacheInterceptor)
export class TelexConnectionController {
    constructor(private telex: TelexService) {
    }

  @Get()
  @CacheTTL(15)
  @ApiOkResponse({ description: 'The paginated list of connections', type: PaginatedTelexConnectionDto })
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
                                @Query(new ValidationPipe({ transform: true })) bounds: BoundsDto): Promise<PaginatedTelexConnectionDto> {
        throw new HttpException('Endpoint temporarily disabled', 401);
        // return this.telex.getActiveConnections(pagination, bounds);
    }

  @Get('_find')
  @CacheTTL(15)
  @ApiQuery({ name: 'flight', description: 'The flight number', example: 'AAL456' })
  @ApiOkResponse({ description: 'All connections matching the query', type: TelexSearchResult })
  findConnection(@Query('flight') flight: string): Promise<TelexSearchResult> {
      return this.telex.findActiveConnectionByFlight(flight);
  }

  @Get('_count')
  @CacheTTL(15)
  @ApiOkResponse({ description: 'The total number of active flights', type: Number })
  countConnections(): Promise<number> {
      return this.telex.countActiveConnections();
  }

  @Get(':id')
  @CacheTTL(15)
  @ApiParam({ name: 'id', description: 'The connection ID', example: '6571f19e-21f7-4080-b239-c9d649347101' })
  @ApiOkResponse({ description: 'The connection with the given ID was found', type: TelexConnection })
  @ApiNotFoundResponse({ description: 'The connection with the given ID could not be found' })
  getSingleConnection(@Param('id') id: string): Promise<TelexConnection> {
      return this.telex.getSingleConnection(id);
  }

  @Post()
  @ApiBody({
      description: 'The new connection containing the flight number and current location',
      type: CreateTelexConnectionDto,
  })
  @ApiCreatedResponse({ description: 'A flight got created', type: FlightToken })
  @ApiBadRequestResponse({ description: 'An active flight with the given flight number is already in use' })
  addNewConnection(@Body() body: CreateTelexConnectionDto): Promise<FlightToken> {
      return this.telex.addNewConnection(body);
  }

  @Put()
  @UseGuards(FlightAuthGuard)
  @ApiSecurity('jwt')
  @ApiBody({ description: 'The updated connection containing the current location', type: UpdateTelexConnectionDto })
  @ApiOkResponse({ description: 'The connection got updated', type: TelexConnection })
  @ApiNotFoundResponse({ description: 'The connection with the given ID could not be found' })
  updateConnection(@Body() body: UpdateTelexConnectionDto, @Request() req): Promise<TelexConnection> {
      return this.telex.updateConnection(req.user.connectionId, body);
  }

  @Delete()
  @UseGuards(FlightAuthGuard)
  @ApiSecurity('jwt')
  @ApiOkResponse({ description: 'The connection got disabled' })
  @ApiNotFoundResponse({ description: 'The connection with the given ID could not be found' })
  disableConnection(@Request() req): Promise<void> {
      return this.telex.disableConnection(req.user.connectionId);
  }
}
