import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AuthModule, ConfigService],
    controllers: [AdminController],
    providers: [AdminService],
})
export class AdminModule {}
