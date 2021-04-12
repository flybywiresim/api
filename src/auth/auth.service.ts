import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FlightToken } from './flights/flight-token.class';

@Injectable()
export class AuthService {
    constructor(
    private jwtService: JwtService,
    ) {}

    login(flight: string, connectionId: string): FlightToken {
        const payload = { flight, sub: connectionId };
        return {
            accessToken: this.jwtService.sign(payload),
            flight,
            connection: connectionId,
        };
    }
}
