import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AdminService {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
    ) {}

    async authenticate(res, code: string | undefined) {
        if (typeof code !== 'undefined') {
            return this.authService.authAdminUser(code);
        }

        const clientId = this.configService.get('auth.gitHubOAuthClientId');

        return res.redirect(`https://github.com/login/oauth/authorize?client_id=${clientId}`);
    }
}
