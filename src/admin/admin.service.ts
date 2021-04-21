import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AdminService {
    constructor(
        private authService: AuthService,
    ) {}

    authenticate(code: string | undefined): string {
        if (typeof code !== 'undefined') {
            return this.authService.authAdminUser(code);
        }
        return 'No code';
    }
}
