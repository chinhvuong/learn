import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class PatchMeConsentDto {
  @ApiProperty({
    description:
      'User confirms they are 18 or older. Idempotent: the server stamps `consentAge18At` only on the first `true` submission; subsequent `true`s do not move the timestamp and `false` is a no-op (consent cannot be withdrawn through this endpoint).',
    example: true,
  })
  @IsBoolean()
  ageOver18: boolean;

  @ApiProperty({
    description:
      'User consents to body-photo storage for try-on generation. Same idempotent semantics as `ageOver18`.',
    example: true,
  })
  @IsBoolean()
  bodyPhotoStorage: boolean;
}
