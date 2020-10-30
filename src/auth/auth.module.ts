import { Logger, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
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
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {
  private readonly logger = new Logger(AuthModule.name);

  constructor() {
    if (!process.env.AUTH_SECRET && process.env.NODE_ENV === 'production') {
      this.logger.error('Use a JWT secret in production mode');
      process.exit(99);
    }
  }
}