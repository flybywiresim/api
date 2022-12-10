import { HttpModule, Module } from '@nestjs/common';
import { SatellitesService } from './satellites.service';
import { SatellitesController } from './satellites.controller';

@Module({
    imports: [HttpModule],
    providers: [SatellitesService],
    controllers: [SatellitesController],
})
export class SatellitesModule {}
