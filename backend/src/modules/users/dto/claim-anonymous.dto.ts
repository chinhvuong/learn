import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ClaimAnonymousDto {
  @ApiProperty({
    description:
      "Backend UUID of the anonymous user whose data should be migrated into the caller's account. " +
      'Idempotent — if the anonymous user no longer exists the call is a no-op.',
    example: '4b3a2c1d-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  })
  @IsUUID('4')
  anonymousUserId!: string;
}
