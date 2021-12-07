import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Connection, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as Filter from 'bad-words';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { TelexConnection } from './entities/telex-connection.entity';
import { TelexMessage } from './entities/telex-message.entity';
import { AuthService } from '../auth/auth.service';
import { FlightToken } from '../auth/flights/flight-token.class';
import { BannedFlightNumbers, BlockedMessageFilters } from './filters';
import { BoundsDto } from '../common/Bounds';
import { PaginationDto } from '../common/Pagination';
import { CreateTelexConnectionDto } from './dto/create-telex-connection.dto';
import { UpdateTelexConnectionDto } from './dto/update-telex-connection.dto';
import { PaginatedTelexConnectionDto } from './dto/paginated-telex-connection.dto';
import { TelexSearchResult } from './dto/telex-search-result.dto';
import { TelexMessageDto } from './dto/telex-message.dto';
import { DiscordService } from '../discord/discord.service';

@Injectable()
export class TelexService {
  private readonly logger = new Logger(TelexService.name);

  private readonly profanityFilter;

  constructor(
    private connection: Connection,
    @InjectRepository(TelexConnection)
    private readonly connectionRepository: Repository<TelexConnection>,
    @InjectRepository(TelexMessage)
    private readonly messageRepository: Repository<TelexMessage>,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly discordService: DiscordService,
  ) {
      this.profanityFilter = new Filter();
  }

  @Cron('*/5 * * * * *')
  private async checkForStaleConnections() {
      if (this.configService.get<boolean>('telex.disableCleanup')) {
          return;
      }

      const timeout = this.configService.get<number>('telex.timeoutMin');
      this.logger.verbose(`Trying to cleanup stale TELEX connections older than ${timeout} minutes`);

      const connections = await this.connectionRepository
          .createQueryBuilder()
          .update()
          .set({ isActive: false })
          .andWhere(`lastContact < NOW() - INTERVAL ${timeout} MINUTE`)
          .andWhere('isActive = 1')
          .execute();

      this.logger.debug(`Set ${connections.affected} stale connections to inactive`);
  }

  // ======= Connection Handling ======= //

  async addNewConnection(connection: CreateTelexConnectionDto): Promise<FlightToken> {
      this.logger.log(`Trying to register new flight '${connection.flight}'`);

      if (BannedFlightNumbers.includes(connection.flight.toUpperCase())) {
          const message = `User tried to use banned flight number: '${connection.flight}'`;
          this.logger.log(message);
          throw new HttpException(message, 400);
      }

      const existingFlight = await this.connectionRepository.findOne({ flight: connection.flight, isActive: true });

      if (existingFlight) {
          const message = `An active flight with the number '${connection.flight}' is already in use`;
          this.logger.error(message);
          throw new HttpException(message, 409);
      }

      const newFlight: TelexConnection = { ...connection };

      this.logger.log(`Registering new flight '${connection.flight}'`);
      await this.connectionRepository.save(newFlight);

      return this.authService.registerFlight(newFlight.flight, newFlight.id);
  }

  async updateConnection(connectionId: string, connection: UpdateTelexConnectionDto): Promise<TelexConnection> {
      this.logger.log(`Trying to update flight with ID '${connectionId}'`);

      const change = await this.connectionRepository.update({ id: connectionId, isActive: true }, connection);

      if (!change.affected) {
          const message = `Active flight with ID '${connectionId}' does not exist`;
          this.logger.error(message);
          throw new HttpException(message, 404);
      }

      this.logger.log(`Updated flight with id '${connectionId}'`);
      return this.connectionRepository.findOne(connectionId);
  }

  async getActiveConnections(pagination: PaginationDto, bounds: BoundsDto): Promise<PaginatedTelexConnectionDto> {
      this.logger.log(`Trying to get ${pagination.take} TELEX connections, skipped ${pagination.skip}`);

      const [results, total] = await this.connectionRepository
          .createQueryBuilder()
          .select()
          .skip(pagination.skip)
          .take(pagination.take)
          .where({ isActive: true })
          .andWhere(
              `ST_Contains(ST_MakeEnvelope(ST_GeomFromText('POINT(${bounds.west} ${bounds.north})'),`
        + ` ST_GeomFromText('POINT(${bounds.east} ${bounds.south})')), location)`,
          )
          .orderBy('firstContact', 'ASC')
          .getManyAndCount();

      return {
          results,
          count: results.length,
          total,
      };
  }

  async countActiveConnections(): Promise<number> {
      this.logger.debug('Trying to get total number of active connections');

      return this.connectionRepository.count({ isActive: true });
  }

  async getSingleConnection(id: string, active?: boolean): Promise<TelexConnection> {
      this.logger.log(`Trying to get single active TELEX connection with ID '${id}'`);

      const conn = await this.connectionRepository.findOne(id);
      if (!conn || (active !== undefined && conn.isActive !== active)) {
          const message = `${active ? 'Active f' : 'F'}light with ID '${id}' does not exist`;
          this.logger.error(message);
          throw new HttpException(message, 404);
      }

      return conn;
  }

  // TODO: Integrate with ORM to have all properties be searchable
  async findActiveConnectionByFlight(query: string): Promise<TelexSearchResult> {
      this.logger.log(`Trying to search for active TELEX connections with flight number '${query}'`);

      const matches = await this.connectionRepository
          .createQueryBuilder()
          .select()
          .andWhere(`UPPER(flight) LIKE UPPER('${query}%')`)
          .andWhere('isActive = 1')
          .orderBy('flight', 'ASC')
          .limit(50)
          .getMany();

      return {
          matches,
          fullMatch: matches.find((x) => x.flight === query) ?? null,
      };
  }

  async disableConnection(connectionId: string): Promise<void> {
      this.logger.log(`Trying to disable TELEX connection with ID '${connectionId}'`);

      const existingFlight = await this.connectionRepository.findOne({ id: connectionId, isActive: true });

      if (!existingFlight) {
          const message = `Active flight with ID '${connectionId}' does not exist`;
          this.logger.error(message);
          throw new HttpException(message, 404);
      }

      this.logger.log(`Disabling flight with ID '${connectionId}'`);
      existingFlight.isActive = false;

      await this.connectionRepository.update(existingFlight.id, existingFlight);
  }

  // ======= Message Handling ======= //

  async sendMessage(dto: TelexMessageDto, fromConnectionId: string): Promise<TelexMessage> {
      this.logger.log(`Trying to send a message from flight with ID '${fromConnectionId}' to flight with number ${dto.to}`);

      const sender = await this.getSingleConnection(fromConnectionId, true);
      if (!sender) {
          const message = `Active flight with ID '${fromConnectionId}' does not exist`;
          this.logger.error(message);
          throw new HttpException(message, 404);
      }

      const recipient = await this.connectionRepository.findOne({ flight: dto.to, isActive: true });
      if (!recipient || !recipient.freetextEnabled) {
          const message = `Active flight '${dto.to}' does not exist`;
          this.logger.error(message);
          throw new HttpException(message, 404);
      }

      const message: TelexMessage = {
          from: sender,
          to: recipient,
          message: dto.message,
          isProfane: this.profanityFilter.isProfane(dto.message),
      };

      // Check for blocked content. This implementation is somehow more resilient than `bad-words`
      const isBlocked = BlockedMessageFilters.some((str) => dto.message.toLowerCase().includes(str.toLowerCase()));

      // No need to await this
      this.discordService.publishTelexMessage(message, isBlocked).then().catch(this.logger.error);

      if (isBlocked) {
          this.logger.warn(`Message with blocked content received: '${dto.message}' by ${sender.flight} (${sender.id})`);

          // Shadow blocking
          message.received = true;
      }

      this.logger.log(`Sending a message from flight with ID '${fromConnectionId}' to flight with number ${dto.to}`);
      const storedMessage = await this.messageRepository.save(message);

      // Shadow blocking
      storedMessage.received = false;
      return storedMessage;
  }

  async fetchMyMessages(connectionId: string,
      acknowledge: boolean): Promise<TelexMessage[]> {
      this.logger.log(`Trying to fetch TELEX messages for flight with ID '${connectionId}'`);

      const messages = await this.messageRepository.find({ to: { id: connectionId }, received: false });

      if (!messages) {
          const message = `Error while fetching TELEX messages for flight with ID '${connectionId}'`;
          this.logger.log(message);
          throw new HttpException(message, 500);
      }

      if (acknowledge && messages.length > 0) {
          this.logger.log(`Acknowledging ${messages.length} TELEX messages for flight with ID '${connectionId}'`);

          await this.messageRepository.update({ to: { id: connectionId }, received: false }, { received: true });
      }

      messages.forEach((msg) => {
          msg.message = this.profanityFilter.clean(msg.message);
      });

      return messages;
  }
}
