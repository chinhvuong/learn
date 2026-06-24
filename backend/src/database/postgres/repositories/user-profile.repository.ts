import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { UserProfileEntity } from '../entities/user-profile.entity';
import { AbstractRepository } from './abstract.repository';

@Injectable()
export class UserProfilesRepository extends AbstractRepository<UserProfileEntity> {
  constructor(@InjectDataSource('postgres') protected readonly dataSource: DataSource) {
    super(UserProfileEntity, dataSource);
  }

  findByUserId(userId: string): Promise<UserProfileEntity | null> {
    return this.findOne({ where: { userId } });
  }
}
