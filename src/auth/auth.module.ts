import { Logger, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { FlightStrategy } from './flights/flight.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

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
  ],
  providers: [AuthService, FlightStrategy],
  exports: [AuthService],
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
