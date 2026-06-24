import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { ItemEntity } from '../entities/item.entity';
import { AbstractRepository } from './abstract.repository';

@Injectable()
export class ItemsRepository extends AbstractRepository<ItemEntity> {
  constructor(@InjectDataSource('postgres') protected readonly dataSource: DataSource) {
    super(ItemEntity, dataSource);
  }

  findByLessonId(lessonId: string): Promise<ItemEntity[]> {
    return this.find({ where: { lessonId } });
  }
}
