import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { UserEntity } from '../entities/user.entity';
import { AbstractRepository } from './abstract.repository';

@Injectable()
export class UsersRepository extends AbstractRepository<UserEntity> {
  constructor(@InjectDataSource('postgres') protected readonly dataSource: DataSource) {
    super(UserEntity, dataSource);
  }

  findOneById(id: string): Promise<UserEntity | null> {
    return this.findOne({ where: { id } });
  }

  findOneByFirebaseUid(firebaseUid: string): Promise<UserEntity | null> {
    return this.findOne({ where: { firebaseUid } });
  }
}
