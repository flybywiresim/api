import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelexConnection } from './entities/telex-connection.entity';
import { TelexService } from './telex.service';
import { TelexConnectionController } from './telex-connection.controller';
import { TelexMessage } from './entities/telex-message.entity';
import { TelexMessageController } from './telex-message.controller';
import { AuthModule } from '../auth/auth.module';
import { DiscordModule } from '../discord/discord.module';
import { BlockedIp } from './entities/blocked-ip.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([TelexConnection, TelexMessage, BlockedIp]),
        AuthModule,
        DiscordModule,
    ],
    providers: [TelexService],
    controllers: [TelexConnectionController, TelexMessageController],
    exports: [TelexService],
})
export class TelexModule {}
