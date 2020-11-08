import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Connection, Repository, Transaction, TransactionRepository } from 'typeorm';
import { TelexConnection, TelexConnectionDto, TelexConnectionUpdateDto } from './telex-connection.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { TelexMessage, TelexMessageDto } from './telex-message.entity';
import * as Filter from 'bad-words';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth/auth.service';
import { Token } from '../auth/token.class';
import { BannedFlightNumbers } from './banned-flight-numbers';

@Injectable()
export class TelexService {
  private readonly logger = new Logger(TelexService.name);
  private readonly messageFilter;

  constructor(
    private connection: Connection,
    @InjectRepository(TelexConnection)
    private readonly connectionRepository: Repository<TelexConnection>,
    @InjectRepository(TelexMessage)
    private readonly messageRepository: Repository<TelexMessage>,
    private readonly configService: ConfigService,
    private readonly authService: AuthService) {
    this.messageFilter = new Filter();
  }

  @Cron('*/5 * * * * *')
  private async checkForStaleConnections() {
    const timeout = this.configService.get<number>('telex.timeoutMin');
    this.logger.verbose(`Trying to cleanup stale TELEX connections older than ${timeout} minutes`);

    const res = await this.connectionRepository
      .createQueryBuilder()
      .select('*')
      .andWhere(`lastContact < NOW() - INTERVAL ${timeout} MINUTE`)
      .andWhere('isActive = 1')
      .getRawMany<TelexConnection>();

    this.logger.verbose(`Found ${res.length} stale connections`);

    res.forEach(async conn => {
      await this.connectionRepository.update(conn.id, { isActive: false });
    });

    this.logger.debug(`Set ${res.length} stale connections to inactive`);
  }

  // ======= Connection Handling ======= //

  async addNewConnection(connection: TelexConnectionDto): Promise<Token> {
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

    const newFlight: TelexConnection = {
      flight: connection.flight,
      location: connection.location,
      trueAltitude: connection.trueAltitude,
      heading: connection.heading,
      origin: connection.origin,
      destination: connection.destination,
    };

    this.logger.log(`Registering new flight '${connection.flight}'`);
    await this.connectionRepository.save(newFlight);

    return this.authService.login(newFlight.flight, newFlight.id);
  }

  async updateConnection(connectionId: string, connection: TelexConnectionUpdateDto): Promise<TelexConnection> {
    this.logger.log(`Trying to update flight with ID '${connectionId}'`);

    const existingFlight = await this.connectionRepository.findOne({ id: connectionId, isActive: true });

    if (!existingFlight) {
      const message = `Active flight with ID '${connectionId}' does not exist`;
      this.logger.error(message);
      throw new HttpException(message, 404);
    }

    this.logger.log(`Updating flight '${existingFlight.flight}'`);

    await this.connectionRepository.update(existingFlight.id, connection);

    return await this.connectionRepository.findOne(existingFlight.id);
  }

  async getAllActiveConnections(): Promise<TelexConnection[]> {
    this.logger.log('Trying to get all active TELEX connections');

    return await this.connectionRepository.find({ isActive: true });
  }

  async getSingleConnection(id: string, active?: boolean): Promise<TelexConnection> {
    this.logger.log(`Trying to get single active TELEX connection with ID '${id}'`);

    const conn = await this.connectionRepository.findOne(id);
    if (!conn || (active != undefined && conn.isActive !== active)) {
      const message = `${active ? 'Active f' : 'F'}light with ID '${id}' does not exist`;
      this.logger.error(message);
      throw new HttpException(message, 404);
    }

    return conn;
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
    if (!recipient) {
      const message = `Active flight '${dto.to}' does not exist`;
      this.logger.error(message);
      throw new HttpException(message, 404);
    }

    const message: TelexMessage = {
      from: sender,
      to: recipient,
      message: this.messageFilter.clean(dto.message),
    };

    this.logger.log(`Sending a message from flight with ID '${fromConnectionId}' to flight with number ${dto.to}`);
    return await this.messageRepository.save(message);
  }

  @Transaction()
  async fetchMyMessages(connectionId: string,
                        acknowledge: boolean,
                        @TransactionRepository(TelexMessage) msgRepo?: Repository<TelexMessage>): Promise<TelexMessage[]> {
    this.logger.log(`Trying to fetch TELEX messages for flight with ID '${connectionId}'`);

    const recipient = await this.getSingleConnection(connectionId, true);

    const messages = await msgRepo.find({ to: recipient, received: false });
    if (!messages || messages.length === 0) {
      const message = `No open TELEX messages found for flight with ID '${connectionId}'`;
      this.logger.log(message);
      throw new HttpException(message, 404);
    }

    if (acknowledge) {
      this.logger.log(`Acknowledging all TELEX messages for flight with ID '${connectionId}'`);
      messages.forEach(x => x.received = true);
      // TODO: Convert to single SQL call
      messages.forEach(async x => await msgRepo.update(x.id, x));
    }

    return messages;
  }
}
