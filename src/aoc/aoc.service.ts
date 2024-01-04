import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { BannedFlightNumbers } from '../telex/filters';
import { CreateAocConnectionDto } from './dto/create-aoc-connection.dto';
import { AuthService } from '../auth/auth.service';
import { FlightToken } from '../auth/flights/flight-token.class';
import { AocConnection } from './entities/aoc-connection.entity';

@Injectable()
export class AocService {
    private readonly logger = new Logger(AocService.name);

    constructor(
        @InjectRepository(AocConnection)
        private readonly connectionRepository: Repository<AocConnection>,
        private readonly configService: ConfigService,
        private readonly authService: AuthService,
    ) {}

    @Cron('*/5 * * * * *')
    private async checkForStaleConnections() {
        if (this.configService.get<boolean>('aoc.disableCleanup')) {
            return;
        }

        const timeout = this.configService.get<number>('aoc.timeoutMin');
        this.logger.verbose(`Trying to cleanup stale AOC connections older than ${timeout} minutes`);

        const connections = await this.connectionRepository
            .createQueryBuilder()
            .update()
            .set({ isActive: false })
            .andWhere(`lastContact < NOW() - INTERVAL ${timeout} MINUTE`)
            .andWhere('isActive = 1')
            .execute();

        this.logger.debug(`Set ${connections.affected} state connection to inactive`);
    }

    async countActiveConnections(): Promise<number> {
        this.logger.debug('Trying to get total number of active connections');

        return this.connectionRepository.count({ isActive: true });
    }

    async addNewConnection(connection: CreateAocConnectionDto): Promise<FlightToken> {
        this.logger.log(`Trying to register new AOC connection '${connection.flight}'`);

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

        const newFlight: AocConnection = { ...connection };

        this.logger.log(`Registering new flight '${connection.flight}'`);
        await this.connectionRepository.save(newFlight);

        return this.authService.registerFlight(newFlight.flight, newFlight.id);
    }
}
