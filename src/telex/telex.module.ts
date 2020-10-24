import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelexConnection } from './telex-connection.entity';
import { TelexService } from './telex.service';
import { TelexConnectionController } from './telex-connection.controller';
import { TelexMessage } from './telex-message.entity';
import { TelexMessageController } from './telex-message.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TelexConnection, TelexMessage])],
  providers: [TelexService],
  controllers: [TelexConnectionController, TelexMessageController],
  exports: [TelexService],
})
export class TelexModule {}
