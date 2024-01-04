import { Body, CacheInterceptor, Controller, Post, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AocService } from './aoc.service';
import { CreateAocConnectionDto } from './dto/create-aoc-connection.dto';
import { FlightToken } from '../auth/flights/flight-token.class';

@ApiTags('AOC')
@Controller('aoc')
@UseInterceptors(CacheInterceptor)
export class AocConnectionController {
    constructor(private aoc: AocService) {
    }

    @Post()
    addNewConnection(@Body() body: CreateAocConnectionDto): Promise<FlightToken> {
        return this.aoc.addNewConnection(body);
    }
}
