import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelexConnection } from './telex-connection.entity';
import { TelexService } from './telex.service';
import { TelexConnectionController } from './telex-connection.controller';
import { TelexMessage } from './telex-message.entity';
import { TelexMessageController } from './telex-message.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([TelexConnection, TelexMessage]), AuthModule],
  providers: [TelexService],
  controllers: [TelexConnectionController, TelexMessageController],
  exports: [TelexService],
})
export class TelexModule {}
