import {
  Body, CacheInterceptor, CacheTTL,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards, UseInterceptors,
  ValidationPipe
} from '@nestjs/common';
import {
  TelexConnection,
  TelexConnectionDto,
  TelexConnectionUpdateDto,
  TelexConnectionPaginatedDto
} from './telex-connection.entity';
import { TelexService } from './telex.service';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam, ApiQuery, ApiSecurity,
  ApiTags
} from '@nestjs/swagger';
import { Token } from '../auth/token.class';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaginationDto } from 'src/common/Pagination';
import { BoundsDto } from '../common/Bounds';

@ApiTags('TELEX')
@Controller('txcxn')
@UseInterceptors(CacheInterceptor)
export class TelexConnectionController {
  constructor(private telex: TelexService) {
  }

  @Get()
  @CacheTTL(15)
  @ApiOkResponse({ description: 'The paginated list of connections', type: TelexConnectionPaginatedDto })
  @ApiQuery({
    name: 'take',
    type: Number,
    required: false,
    description: 'The number of connections to take',
    schema: { maximum: 25, minimum: 0, default: 25 }
  })
  @ApiQuery({
    name: 'skip',
    type: Number,
    required: false,
    description: 'The number of connections to skip',
    schema: { minimum: 0, default: 0 }
  })
  @ApiQuery({
    name: 'north',
    type: Number,
    required: false,
    description: 'Latitude for the north edge of the bounding box',
    schema: { minimum: -90, maximum: 90, default: 90 }
  })
  @ApiQuery({
    name: 'east',
    type: Number,
    required: false,
    description: 'Longitude for the east edge of the bounding box',
    schema: { minimum: -180, maximum: 180, default: 180 }
  })
  @ApiQuery({
    name: 'south',
    type: Number,
    required: false,
    description: 'Latitude for the south edge of the bounding box',
    schema: { minimum: -90, maximum: 90, default: -90 }
  })
  @ApiQuery({
    name: 'west',
    type: Number,
    required: false,
    description: 'Longitude for the west edge of the bounding box',
    schema: { minimum: -180, maximum: 180, default: -180 }
  })
  async getAllActiveConnections(@Query(new ValidationPipe({ transform: true })) pagination: PaginationDto,
                                @Query(new ValidationPipe({ transform: true })) bounds: BoundsDto): Promise<TelexConnectionPaginatedDto> {
    return await this.telex.getActiveConnections(pagination, bounds);
  }

  @Get('_find')
  @CacheTTL(15)
  @ApiQuery({ name: 'flight', description: 'The flight number', example: 'AAL456' })
  @ApiOkResponse({ description: 'The connection with the given parameters was found', type: TelexConnection })
  @ApiNotFoundResponse({ description: 'The connection with the given parameters could not be found' })
  async findConnection(@Query('flight') flight: string): Promise<TelexConnection> {
    return await this.telex.findActiveConnectionByFlight(flight);
  }

  @Get('_count')
  @CacheTTL(15)
  @ApiOkResponse({ description: 'The total number of active flights', type: Number })
  async countConnections(): Promise<number> {
    return await this.telex.countActiveConnections();
  }

  @Get(':id')
  @CacheTTL(15)
  @ApiParam({ name: 'id', description: 'The connection ID', example: '6571f19e-21f7-4080-b239-c9d649347101' })
  @ApiOkResponse({ description: 'The connection with the given ID was found', type: TelexConnection })
  @ApiNotFoundResponse({ description: 'The connection with the given ID could not be found' })
  async getSingleConnection(@Param('id') id: string): Promise<TelexConnection> {
    return await this.telex.getSingleConnection(id);
  }

  @Post()
  @ApiBody({
    description: 'The new connection containing the flight number and current location',
    type: TelexConnectionDto
  })
  @ApiCreatedResponse({ description: 'A flight got created', type: Token })
  @ApiBadRequestResponse({ description: 'An active flight with the given flight number is already in use' })
  async addNewConnection(@Body() body: TelexConnectionDto): Promise<Token> {
    return await this.telex.addNewConnection(body);
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  @ApiSecurity('jwt')
  @ApiBody({ description: 'The updated connection containing the current location', type: TelexConnectionUpdateDto })
  @ApiOkResponse({ description: 'The connection got updated', type: TelexConnection })
  @ApiNotFoundResponse({ description: 'The connection with the given ID could not be found' })
  async updateConnection(@Body() body: TelexConnectionUpdateDto, @Request() req): Promise<TelexConnection> {
    return await this.telex.updateConnection(req.user.connectionId, body);
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @ApiSecurity('jwt')
  @ApiOkResponse({ description: 'The connection got disabled' })
  @ApiNotFoundResponse({ description: 'The connection with the given ID could not be found' })
  async disableConnection(@Request() req): Promise<void> {
    return await this.telex.disableConnection(req.user.connectionId);
  }
}
