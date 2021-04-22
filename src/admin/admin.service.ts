import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AdminService {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
    ) {}

    async authenticate(res, code: string | undefined): Promise<string> {
        if (typeof code !== 'undefined') {
            return this.authService.authAdminUser(res, code);
        }

        const clientId = this.configService.get('auth.gitHubOAuthClientId');

        const scope = 'read:user read:org';

        return res.redirect(`https://github.com/login/oauth/authorize?client_id=${clientId}&scope=${scope}`);
    }
}
