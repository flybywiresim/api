import { Controller, Get, Post, Query, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminService } from './admin.service';

@Controller('admin/auth')
export class AdminController {
    constructor(
        private readonly adminService: AdminService,
        private readonly configService: ConfigService,
    ) {}

    @Get()
    authenticate(@Res() res) {
        const clientId = this.configService.get('auth.gitHubOAuthClientId');

        return res.redirect(`https://github.com/login/oauth/authorize?client_id=${clientId}`);
    }

    @Post()
    useCode(@Query('code') code?: string) {
        return this.adminService.authenticate(code);
    }
}
