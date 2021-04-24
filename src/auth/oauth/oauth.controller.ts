import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Query, Redirect } from '@nestjs/common';
import { RedirectDetails } from '../../utilities/redirect-details';
import { OauthService } from './oauth.service';
import { TokenPair } from '../token-pair.class';

@ApiTags('OAuth')
@Controller('api/v1/oauth')
export class OauthController {
    constructor(private oauthService: OauthService) {
    }

    @Get('/github')
    @Redirect('https://github.com/login/oauth/authorize', 301)
    githubLogin(): RedirectDetails {
        return this.oauthService.githubLogin();
    }

    @Get('/github/callback')
    githubCallback(@Query('code') code: string, @Query('state') state: string): Promise<TokenPair> {
        return this.oauthService.githubCallback(code, state);
    }
}
