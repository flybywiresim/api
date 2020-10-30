import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Token } from './token.class';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService
  ) {}

  login(flight: string, connectionId: string): Token {
    const payload = { flight, sub: connectionId };
    return {
      accessToken: this.jwtService.sign(payload),
      flight: flight,
      connection: connectionId,
    };
  }
}
