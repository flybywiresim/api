import { HttpService, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { FlightToken } from './flights/flight-token.class';

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
        private http: HttpService,
    ) {}

    registerFlight(flight: string, connectionId: string): FlightToken {
        const payload = { flight, sub: connectionId };
        return {
            accessToken: this.jwtService.sign(payload),
            flight,
            connection: connectionId,
        };
    }

    async authAdminUser(code: string) {
        const clientId = this.configService.get('auth.gitHubOAuthClientId');
        const clientSecret = this.configService.get('auth.gitHubOAuthClientSecret');

        const resp = await this.http.get('https://github.com/login/oauth/access_token', {
            method: 'post',
            responseType: 'json',
            headers: { Accept: 'application/json' },
            params: {
                client_id: clientId,
                client_secret: clientSecret,
                code,
            },
        }).toPromise();

        const token = resp.data.access_token;

        if (typeof token !== 'undefined') {
            const resp = await this.http.get('https://api.github.com/user', { headers: { Authorization: `Bearer ${token}` }, responseType: 'json' }).toPromise();

            console.log(resp.data);

            return resp.data;
        }

        return Promise.reject(Error('No Token'));
    }
}
