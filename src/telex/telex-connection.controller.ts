import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { TelexConnection, TelexConnectionDto, TelexConnectionUpdateDto, TelexConnectionPaginatedDto } from './telex-connection.entity';
import { TelexService } from './telex.service';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam, ApiQuery, ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Token } from '../auth/token.class';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaginationDto } from 'src/common/Pagination';

@ApiTags('TELEX')
@Controller('txcxn')
export class TelexConnectionController {
  constructor(private telex: TelexService) {
  }

  @Get()
  @ApiOkResponse({ description: 'The paginated list of connections', type: TelexConnectionPaginatedDto })
  @ApiQuery({ name: 'take', type: Number, required: false, description: 'The number of connections to take', schema: { maximum: 25, minimum: 0, default: 25 } })
  @ApiQuery({ name: 'skip', type: Number, required: false, description: 'The number of connections to skip', schema: { minimum: 0, default: 0 } })
  async getAllActiveConnections(@Query(new ValidationPipe({ transform: true })) pagination: PaginationDto): Promise<TelexConnectionPaginatedDto> {
    // TODO: Investigate the trouble this endpoint causes
    // It somehow manages to break the whole server when running in PROD
    throw new HttpException("Endpoint temporarily disabled", 503);

    // return await this.telex.getActiveConnections(pagination);
  }

  @Get('_find')
  @ApiQuery({ name: 'flight', description: 'The flight number', example: 'AAL456' })
  @ApiOkResponse({ description: 'The connection with the given parameters was found', type: TelexConnection })
  @ApiNotFoundResponse({ description: 'The connection with the given parameters could not be found' })
  async findConnection(@Query('flight') flight: string): Promise<TelexConnection> {
    return await this.telex.findActiveConnectionByFlight(flight);
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'The connection ID', example: '6571f19e-21f7-4080-b239-c9d649347101' })
  @ApiOkResponse({ description: 'The connection with the given ID was found', type: TelexConnection })
  @ApiNotFoundResponse({ description: 'The connection with the given ID could not be found' })
  async getSingleConnection(@Param('id') id: string): Promise<TelexConnection> {
    return await this.telex.getSingleConnection(id);
  }

  @Post()
  @ApiBody({
    description: 'The new connection containing the flight number and current location',
    type: TelexConnectionDto,
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
