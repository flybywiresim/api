import { Module } from '@nestjs/common';
import { WindsService } from './winds.service';
import { WindsController } from './winds.controller';

@Module({
    controllers: [WindsController],
    providers: [WindsService],
})
export class WindsModule {}
