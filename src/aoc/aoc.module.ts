import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AocConnection } from './entities/aoc-connection.entity';
import { AocConnectionController } from './aoc-connection.controller';
import { AocService } from './aoc.service';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([AocConnection]),
        AuthModule,
    ],
    providers: [AocService],
    controllers: [AocConnectionController],
    exports: [AocService],
})
export class AocModule {}
