import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({
    description: 'Internal UUID of the user',
    example: '0193f3b8-7c2a-7c1a-9e0d-1a2b3c4d5e6f',
  })
  id: string;

  @ApiProperty({
    description:
      'Firebase Auth `uid` — stable identifier produced by Firebase regardless of the underlying provider (Apple, Google, …).',
    example: 'TpO5Y8xMqOZLEKzj9b9F0cZQbDi2',
  })
  firebaseUid: string;

  @ApiProperty({
    description:
      'Email captured from the verified Firebase token at first sign-in. Nullable — scrubbed on account deletion (GDPR), or absent when the user signs in with Apple "Hide My Email" and denies email sharing.',
    nullable: true,
    example: 'jane@privaterelay.appleid.com',
  })
  email: string | null;

  @ApiProperty({
    description: 'ISO-8601 timestamp of account creation',
    example: '2026-05-25T10:30:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description:
      'ISO-8601 timestamp when the user confirmed they are 18 or older. `null` until they submit the consent screen at least once with the box ticked. Set once, never reset.',
    nullable: true,
    required: false,
    example: '2026-05-28T15:42:11.000Z',
  })
  consentAge18At?: string | null;

  @ApiProperty({
    description:
      'ISO-8601 timestamp when the user consented to body-photo storage. `null` until they submit the consent screen at least once with the box ticked. Set once, never reset.',
    nullable: true,
    required: false,
    example: '2026-05-28T15:42:11.000Z',
  })
  consentBodyPhotoAt?: string | null;

  @ApiProperty({
    description:
      'Display name from the style-profile questionnaire. `null` until the user submits the questionnaire at least once with a non-empty display name.',
    nullable: true,
    required: false,
    example: 'Jane D.',
  })
  displayName?: string | null;
}
