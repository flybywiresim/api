import { HttpService, Injectable, Logger } from '@nestjs/common';
import { map, tap } from 'rxjs/operators';
import { ConfigService } from '@nestjs/config';
import { TelexMessage } from '../telex/entities/telex-message.entity';

@Injectable()
export class DiscordService {
    private readonly logger = new Logger(DiscordService.name);

    private readonly webhookUrl = this.configService.get<string>('telex.discordWebhook');

    constructor(
        private readonly http: HttpService,
        private readonly configService: ConfigService,
    ) {
    }

    public async publishTelexMessage(telexMessage: TelexMessage, blocked: boolean): Promise<any> {
        if (!this.webhookUrl) {
            this.logger.debug('Discord Webhook URL not configured -> skipping');
            return;
        }

        let color = 6280776; // #5fd648
        color = telexMessage.isProfane ? 14671680 : color; // #dfdf40
        color = blocked ? 14299698 : color; // #da3232

        const discordMessage = {
            embeds: [{
                title: `${telexMessage.from.flight} -> ${telexMessage.to.flight}`,
                description: telexMessage.message,
                color,
                fields: [
                    {
                        name: 'Sender ID',
                        value: `\`${telexMessage.from.id}\``,
                        inline: true,
                    },
                    {
                        name: 'Recipient ID',
                        value: `\`${telexMessage.to.id}\``,
                        inline: true,
                    },
                    {
                        name: 'Profanity',
                        value: `\`${telexMessage.isProfane ? 'true' : 'false'}\``,
                        inline: true,
                    },
                    {
                        name: 'Blocked',
                        value: `\`${blocked ? 'true' : 'false'}\``,
                        inline: true,
                    },
                ],
            }],
        };

        await this.http.post<any>(this.webhookUrl, discordMessage)
            .pipe(
                tap((response) => this.logger.debug(`Response status ${response.status} for Discord webhook request`)),
                map((response) => response.data),
            )
            .toPromise();
    }
}
