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
import { PaginatedAocConnectionDto } from './dto/paginated-aoc-connection.dto';
import { PaginationDto } from '../common/Pagination';
import { BoundsDto } from '../common/Bounds';
import { AocConnectionSearchResultDto } from './dto/aoc-connection-search-result.dto';
import { UpdateAocConnectionDto } from './dto/update-aoc-connection.dto';

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

    async getActiveConnections(pagination: PaginationDto, bounds: BoundsDto): Promise<PaginatedAocConnectionDto> {
        this.logger.log(`Trying to get ${pagination.take} AOC connections, skipped ${pagination.skip}`);

        const [results, total] = await this.connectionRepository
            .createQueryBuilder()
            .select()
            .skip(pagination.skip)
            .take(pagination.take)
            .where({ isActive: true })
            .andWhere(
                `ST_Contains(ST_MakeEnvelope(ST_GeomFromText('POINT(${bounds.west} ${bounds.north})'),`
                + ` ST_GeomFromText('Point(${bounds.east} ${bounds.south})')), location)`,
            )
            .orderBy('firstContact', 'ASC')
            .getManyAndCount();

        return {
            results,
            count: results.length,
            total,
        };
    }

    async getSingleConnection(id: string, active?: boolean): Promise<AocConnection> {
        this.logger.log(`Trying to get single active AOC connection with ID '${id}'`);

        const conn = await this.connectionRepository.findOne(id);
        if (!conn || (active !== undefined && conn.isActive !== active)) {
            const message = `${active ? 'Active f' : 'F'}light with ID '${id}' does not exist`;
            this.logger.error(message);
            throw new HttpException(message, 404);
        }

        return conn;
    }

    async findActiveConnectionByFlight(query: string): Promise<AocConnectionSearchResultDto> {
        this.logger.log(`Trying to search for active AOC connections with flight number '${query}'`);

        const matches = await this.connectionRepository
            .createQueryBuilder()
            .select()
            .where(`UPPER(flight) LIKE UPPER('${query}%')`)
            .andWhere('isActive = 1')
            .orderBy('flight', 'ASC')
            .limit(50)
            .getMany();

        return {
            matches,
            fullMatch: matches.find((x) => x.flight === query) ?? null,
        };
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

    async updateConnection(connectionId: string, connection: UpdateAocConnectionDto): Promise<AocConnection> {
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

    async disableConnection(connectionId: string): Promise<void> {
        this.logger.log(`Trying to disable TELEX connection with ID '${connectionId}'`);

        const existingFlight = await this.connectionRepository.findOne({ id: connectionId, isActive: true });

        if (!existingFlight) {
            const message = `Active flight with ID '${connectionId}' does not exist`;
            this.logger.error(message);
            throw new HttpException(message, 404);
        }

        this.logger.log(`Disabling flight with ID '${connectionId}'`);

        await this.connectionRepository.update(existingFlight.id, { isActive: false });
    }
}
