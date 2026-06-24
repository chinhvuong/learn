import { ApiProperty } from '@nestjs/swagger';

/**
 * Runtime configuration the client fetches on launch. Lets ops tune
 * client-side behaviour from the server without shipping an app build. Empty
 * for now — grows as more knobs are needed.
 */
export class ClientConfigDto {
  @ApiProperty({
    description: 'Placeholder for future server-tunable client flags.',
    required: false,
    example: {},
  })
  flags?: Record<string, unknown>;
}
