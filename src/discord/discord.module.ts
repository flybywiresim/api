import { HttpModule, Module } from '@nestjs/common';
import { DiscordService } from './discord.service';

@Module({
    imports: [
        HttpModule,
    ],
    providers: [DiscordService],
    controllers: [],
    exports: [DiscordService],
})
export class DiscordModule {}
