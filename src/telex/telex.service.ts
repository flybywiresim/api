import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Connection, Repository, Transaction, TransactionRepository } from 'typeorm';
import { TelexConnection, TelexConnectionDTO } from './telex-connection.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { TelexMessage, TelexMessageDTO } from './telex-message.entity';
import * as Filter from 'bad-words';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';

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
    private readonly configService: ConfigService) {
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

  async addNewConnection(connection: TelexConnectionDTO, ipAddress: string): Promise<TelexConnection> {
    this.logger.log(`Trying to register new flight '${connection.flight}'`);

    const existingFlight = await this.connectionRepository.findOne({ flight: connection.flight, isActive: true });

    if (existingFlight) {
      const message = `An active flight with the number '${connection.flight}' is already in use`;
      this.logger.error(message);
      throw new HttpException(message, 400);
    }

    const newFlight: TelexConnection = {
      flight: connection.flight,
      location: connection.location,
      ip: ipAddress,
    };

    this.logger.log(`Registering new flight '${connection.flight}'`);
    return await this.connectionRepository.save(newFlight);
  }

  async updateConnection(id: string, connection: TelexConnectionDTO, ipAddress: string): Promise<TelexConnection> {
    this.logger.log(`Trying to update flight with ID '${id}'`);

    const existingFlight = await this.connectionRepository.findOne({ id, isActive: true, ip: ipAddress });

    if (!existingFlight) {
      const message = `Active flight with ID '${id}' does not exist with your IP`;
      this.logger.error(message);
      throw new HttpException(message, 404);
    }

    this.logger.log(`Updating flight '${existingFlight.flight}'`);
    existingFlight.location = connection.location;

    // Following properties should not be changeable
    delete existingFlight.flight;
    delete existingFlight.isActive;

    await this.connectionRepository.update(existingFlight.id, existingFlight);

    return await this.connectionRepository.findOne(existingFlight.id);
  }

  async getAllActiveConnections(): Promise<TelexConnection[]> {
    this.logger.log('Trying to get all active TELEX connections');

    const conns = await this.connectionRepository.find({ isActive: true });

    conns.forEach(x => TelexService.sanitize(x));

    return conns;
  }

  async getSingleConnection(id: string, ipAddress: string, active?: boolean): Promise<TelexConnection> {
    this.logger.log(`Trying to get single active TELEX connection with ID '${id}'`);

    const conn = await this.connectionRepository.findOne(id);
    if (!conn || (active != undefined && conn.isActive !== active)) {
      const message = `${active ? 'Active f' : 'F'}light with ID '${id}' does not exist`;
      this.logger.error(message);
      throw new HttpException(message, 404);
    }

    // Redact connection if IP is not matching
    if (ipAddress !== ipAddress) {
      TelexService.sanitize(conn);
    }

    return conn;
  }

  async disableConnection(id: string, ipAddress: string): Promise<void> {
    this.logger.log(`Trying to disable TELEX connection with ID '${id}'`);

    const existingFlight = await this.connectionRepository.findOne({ id, isActive: true, ip: ipAddress });

    if (!existingFlight) {
      const message = `Active flight with ID '${id}' does not exist with your IP`;
      this.logger.error(message);
      throw new HttpException(message, 404);
    }


    this.logger.log(`Disabling flight with ID '${id}'`);
    existingFlight.isActive = false;

    await this.connectionRepository.update(existingFlight.id, existingFlight);
  }

  // ======= Message Handling ======= //

  async sendMessage(dto: TelexMessageDTO, fromIp: string): Promise<TelexMessage> {
    this.logger.log(`Trying to send a message from flight with ID '${dto.from}' to flight with number ${dto.to}`);

    const sender = await this.getSingleConnection(dto.from, fromIp, true);
    if (!sender) {
      const message = `Active flight with ID '${dto.from}' does not exist with your IP`;
      this.logger.error(message);
      throw new HttpException(message, 400);
    }

    const recipient = await this.connectionRepository.findOne({ flight: dto.to, isActive: true });
    if (!recipient) {
      const message = `Active flight '${dto.to}' does not exist`;
      this.logger.error(message);
      throw new HttpException(message, 400);
    }

    const message: TelexMessage = {
      from: sender,
      to: recipient,
      message: this.messageFilter.clean(dto.message),
    };

    this.logger.log(`Sending a message from flight with ID '${dto.from}' to flight with number ${dto.to}`);
    const savedMsg = await this.messageRepository.save(message);

    TelexService.sanitize(savedMsg.from);
    TelexService.sanitize(savedMsg.to);

    return savedMsg;
  }

  @Transaction()
  async fetchMyMessages(id: string,
                        fromIp: string,
                        acknowledge: boolean,
                        @TransactionRepository(TelexMessage) msgRepo?: Repository<TelexMessage>): Promise<TelexMessage[]> {
    this.logger.log(`Trying to fetch TELEX messages for flight with ID '${id}'`);

    const recipient = await this.getSingleConnection(id, fromIp, true);

    const messages = await msgRepo.find({ to: recipient, received: false });
    if (!messages || messages.length === 0) {
      const message = `No open TELEX messages found for flight with ID '${id}' and your IP`;
      this.logger.log(message);
      throw new HttpException(message, 404);
    }

    if (acknowledge) {
      this.logger.log(`Acknowledging all TELEX messages for flight with ID '${id}'`);
      messages.forEach(x => x.received = true);
      // TODO: Convert to single SQL call
      messages.forEach(async x => await msgRepo.update(x.id, x));
    }

    messages.forEach(x => TelexService.sanitize(x.from));

    return messages;
  }

  private static sanitize(conn: TelexConnection) {
    if (conn.id) {
      conn.id = '[REDACTED]';
    }
    if (conn.ip) {
      conn.ip = '[REDACTED]';
    }
  }
}
