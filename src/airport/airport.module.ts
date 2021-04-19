import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AirportService } from './airport.service';
import { AirportController } from './airport.controller';
import { AirportAugmentation } from './airport-augmentation.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([AirportAugmentation]),
        HttpModule,
    ],
    providers: [AirportService],
    controllers: [AirportController],
})
export class AirportModule {}
