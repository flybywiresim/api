import { HttpException, HttpService, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedirectDetails } from '../../utilities/redirect-details';
import { TokenPair } from '../token-pair.class';
import { AuthService } from '../auth.service';

@Injectable()
export class OauthService {
    private readonly logger = new Logger(OauthService.name);

    constructor(
        private configService: ConfigService,
        private http: HttpService,
        private authService: AuthService,
    ) {
    }

    githubLogin(): RedirectDetails {
        const clientId = this.configService.get('auth.oauth.github.clientId');
        const scope = 'read:user read:org';
        const state = Math.floor(Math.random() * 1000000000).toString();

        return {
            url: `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=${scope}&state=${state}`,
            statusCode: 302,
        };
    }

    async githubCallback(code: string, state: string): Promise<TokenPair> {
        this.logger.log('Github OAuth login callback');

        const clientId = this.configService.get('auth.oauth.github.clientId');
        const clientSecret = this.configService.get('auth.oauth.github.secret');

        const response = await this.http.get('https://github.com/login/oauth/access_token', {
            method: 'post',
            headers: { Accept: 'application/json' },
            params: {
                client_id: clientId,
                client_secret: clientSecret,
                code,
                state,
            },
        }).toPromise();

        if (response.data.error) {
            throw new HttpException(response.data.error, 401);
        }

        const userData = await this.http.get('https://api.github.com/user',
            { headers: { Authorization: `${response.data.token_type} ${response.data.access_token}` } })
            .toPromise();

        const orgData = await this.http.get(userData.data.organizations_url,
            { headers: { Authorization: `${response.data.token_type} ${response.data.access_token}` } })
            .toPromise();

        return this.authService.generateTokenPair({
            sub: userData.data.id.toString(),
            org: orgData.data.map((org) => org.id.toString()),
            jti: Math.floor(Math.random() * 1000000000).toString(),
        }, {
            sub: userData.data.id.toString(),
            jti: Math.floor(Math.random() * 1000000000).toString(),
        });
    }
}
