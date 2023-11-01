import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FlightToken } from './flights/flight-token.class';
import { TokenPair } from './token-pair.class';

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
    ) {}

    registerFlight(flight: string, connectionId: string): FlightToken {
        const payload = { flight, sub: connectionId };
        return {
            accessToken: this.jwtService.sign(payload),
            flight,
            connection: connectionId,
        };
    }

    generateTokenPair(tokenPayload: any, refreshTokenPayload: any): TokenPair {
        return {
            accessToken: this.jwtService.sign(tokenPayload, { expiresIn: '30min' }),
            refreshToken: this.jwtService.sign(refreshTokenPayload, { expiresIn: '30d' }),
        };
    }
}
