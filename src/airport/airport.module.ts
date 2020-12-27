import { HttpModule, Module } from '@nestjs/common';
import { AirportService } from './airport.service';
import { AirportController } from './airport.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AirportAugmentation } from './airport-augmentation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AirportAugmentation]),
    HttpModule,
  ],
  providers: [AirportService],
  controllers: [AirportController]
})
export class AirportModule {}
