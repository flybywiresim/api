import { HttpModule, Module } from '@nestjs/common';
import { GnssService } from './gnss.service';
import { GnssController } from './gnss.controller';

@Module({
    imports: [HttpModule],
    providers: [GnssService],
    controllers: [GnssController],
})
export class GnssModule {}
