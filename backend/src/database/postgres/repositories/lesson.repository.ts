import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { LessonEntity } from '../entities/lesson.entity';
import { AbstractRepository } from './abstract.repository';

@Injectable()
export class LessonsRepository extends AbstractRepository<LessonEntity> {
  constructor(@InjectDataSource('postgres') protected readonly dataSource: DataSource) {
    super(LessonEntity, dataSource);
  }

  /** All Lessons of a Source, in segment order. */
  findBySourceId(sourceId: string): Promise<LessonEntity[]> {
    return this.find({ where: { sourceId }, order: { segmentIndex: 'ASC' } });
  }
}
