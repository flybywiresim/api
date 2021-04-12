import { ApiProperty } from '@nestjs/swagger';

export class ArtifactInfo {
  @ApiProperty({ description: 'URL of the artifact', example: 'https://.../zip' })
  artifactUrl: string;
}
