import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class PatchMeProfileDto {
  @ApiProperty({
    description:
      'Display name shown in the app. When present must be a non-empty string. Omit to leave unchanged.',
    example: 'Jane D.',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  displayName?: string;

  @ApiProperty({
    description:
      'Shopping pain points from Q2 of the questionnaire. Replaces the previous value when provided. Omit to leave unchanged.',
    example: ['hard_to_visualize', 'wrong_fit'],
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  shoppingPains?: string[];

  @ApiProperty({
    description:
      'Style identifiers from Q3 of the questionnaire. Replaces the previous value when provided. Omit to leave unchanged.',
    example: ['minimal', 'streetwear'],
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  styles?: string[];

  @ApiProperty({
    description:
      'Occasion tags from Q4 of the questionnaire. Replaces the previous value when provided. Omit to leave unchanged.',
    example: ['work', 'weekend'],
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  occasions?: string[];

  @ApiProperty({
    description: 'Gender from step 2 of the questionnaire. Omit to leave unchanged.',
    example: 'woman',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiProperty({
    description:
      'Style-preference tags from step 3 of Questionnaire V2. Replaces the previous value when provided. Omit to leave unchanged.',
    example: ['minimal', 'streetwear', 'vintage'],
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  stylePreferences?: string[];

  @ApiProperty({
    description: 'ISO 3166-1 alpha-2 country code from step 4. Omit to leave unchanged.',
    example: 'VN',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({
    description: 'Height in centimetres (step 5). Omit to leave unchanged.',
    example: 168,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(50)
  @Max(300)
  heightCm?: number;

  @ApiProperty({
    description: 'Weight in kilograms (step 5). Omit to leave unchanged.',
    example: 60.5,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(20)
  @Max(500)
  weightKg?: number;

  @ApiProperty({
    description: 'Bust measurement in centimetres (step 5). Omit to leave unchanged.',
    example: 86,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(50)
  @Max(200)
  bustCm?: number;

  @ApiProperty({
    description: 'Waist measurement in centimetres (step 5). Omit to leave unchanged.',
    example: 66,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(40)
  @Max(200)
  waistCm?: number;

  @ApiProperty({
    description: 'Hips measurement in centimetres (step 5). Omit to leave unchanged.',
    example: 92,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(50)
  @Max(200)
  hipsCm?: number;

  @ApiProperty({
    description:
      'Pass `true` on the final submission to stamp `completedAt`. Idempotent — subsequent `true`s do not move the timestamp. Omit or pass `false` to leave unchanged.',
    required: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
