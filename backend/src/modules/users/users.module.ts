import { Module } from '@nestjs/common';

import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';

// Self-contained: DatabaseModule is global, so the User/UserProfile
// repositories the service depends on are already available app-wide.
@Module({
  imports: [],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
