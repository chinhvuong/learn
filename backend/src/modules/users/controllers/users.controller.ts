import { Body, Controller, Get, HttpCode, Patch, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import type { UserEntity } from '@database/postgres';
import { CurrentUser } from '@shared/auth';

import { ClaimAnonymousDto } from '@modules/users/dto/claim-anonymous.dto';
import { PatchMeConsentDto } from '@modules/users/dto/patch-me-consent.dto';
import { PatchMeProfileDto } from '@modules/users/dto/patch-me-profile.dto';
import { UserDto } from '@modules/users/dto/user.dto';
import { UsersService } from '@modules/users/services/users.service';

@ApiTags('Users')
@Controller('me')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiOperation({
    summary: 'Get current user profile including style-questionnaire display name.',
  })
  @ApiResponse({ status: 200, description: 'Current user profile', type: UserDto })
  async getMe(@CurrentUser() user: UserEntity): Promise<UserDto> {
    return this.users.getMe(user);
  }

  @Patch('consent')
  @ApiOperation({
    summary:
      'Record consent flags for the current user. Idempotent: `true` stamps the corresponding column on first submission; subsequent `true`s do not move the timestamp; `false` is a no-op.',
  })
  @ApiBody({ type: PatchMeConsentDto })
  @ApiResponse({ status: 200, description: 'Updated current user profile', type: UserDto })
  async patchConsent(
    @CurrentUser() user: UserEntity,
    @Body() body: PatchMeConsentDto,
  ): Promise<UserDto> {
    return this.users.setConsent(user, body.ageOver18, body.bodyPhotoStorage);
  }

  @Patch('profile')
  @ApiOperation({
    summary:
      'Store style-questionnaire answers. Partial — only provided fields are updated. Pass `completed: true` on final submission to stamp the completion timestamp.',
  })
  @ApiBody({ type: PatchMeProfileDto })
  @ApiResponse({ status: 200, description: 'Updated current user profile', type: UserDto })
  async patchProfile(
    @CurrentUser() user: UserEntity,
    @Body() body: PatchMeProfileDto,
  ): Promise<UserDto> {
    return this.users.setProfile(user, body);
  }

  @Post('claim-anonymous')
  @HttpCode(200)
  @ApiOperation({
    summary:
      "Migrate an anonymous session into the caller's real account. " +
      'Merges the anonymous profile data into the real account, then removes the anonymous user. ' +
      'Idempotent — no-op if the anonymous user no longer exists.',
  })
  @ApiBody({ type: ClaimAnonymousDto })
  @ApiResponse({ status: 200, description: 'Real user profile after claim', type: UserDto })
  async claimAnonymous(
    @CurrentUser() user: UserEntity,
    @Body() body: ClaimAnonymousDto,
  ): Promise<UserDto> {
    return this.users.claimAnonymous(user, body);
  }
}
