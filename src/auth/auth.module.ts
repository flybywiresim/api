import { HttpModule, Logger, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FlightStrategy } from './flights/flight.strategy';
import { AuthService } from './auth.service';
import { GithubJwtStrategy } from './oauth/github-jwt-strategy.service';
import { OauthService } from './oauth/oauth.service';
import { OauthController } from './oauth/oauth.controller';

@Module({
    imports: [
        ConfigService,
        PassportModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get('auth.secret'),
                signOptions: { expiresIn: configService.get('auth.expires') },
            }),
            inject: [ConfigService],
        }),
        HttpModule,
    ],
    providers: [AuthService, FlightStrategy, GithubJwtStrategy, OauthService],
    exports: [AuthService],
    controllers: [OauthController],
})
export class AuthModule {
  private readonly logger = new Logger(AuthModule.name);

  constructor(private readonly configService: ConfigService) {
      if (configService.get('auth.secret') === 'FlyByWire') {
          this.logger.error('Use a JWT secret in production mode');
          process.exit(99);
      }
  }
}
