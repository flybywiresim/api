import { HttpModule, Module } from '@nestjs/common';
import { ChartsController } from './charts.controller';
import { ChartsService } from './charts.service';

@Module({
  imports: [HttpModule],
  providers: [ChartsService],
  controllers: [ChartsController]
})
export class ChartsModule {}
