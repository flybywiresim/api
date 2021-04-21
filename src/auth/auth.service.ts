import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/core';
import { createOAuthUserAuth } from '@octokit/auth-oauth-user';
import { FlightToken } from './flights/flight-token.class';

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
    ) {}

    registerFlight(flight: string, connectionId: string): FlightToken {
        const payload = { flight, sub: connectionId };
        return {
            accessToken: this.jwtService.sign(payload),
            flight,
            connection: connectionId,
        };
    }

    async authAdminUser(code: string): Promise<string> {
        const octokit = new Octokit({
            authStrategy: createOAuthUserAuth,
            auth: {
                clientId: this.configService.get('auth.gitHubOAuthClientId'),
                clientSecret: this.configService.get('auth.gitHubOAuthClientSecret'),
                code,
            },
        });

        const { data: { login } } = await octokit.request('GET /user');

        return login;
    }
}
