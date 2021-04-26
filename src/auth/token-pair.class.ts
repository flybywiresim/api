import { ApiProperty } from '@nestjs/swagger';

export class TokenPair {
    @ApiProperty({ description: 'The access token for secured endpoints' })
    accessToken: string;

    @ApiProperty({ description: 'The refresh token to fetch new access tokens' })
    refreshToken: string;
}
