import { Controller, Get, Query, Res } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin/auth')
export class AdminController {
    constructor(
        private readonly adminService: AdminService,
    ) {}

    @Get()
    authenticate(@Res() res, @Query('code') code?: string) {
        return this.adminService.authenticate(res, code);
    }
}
