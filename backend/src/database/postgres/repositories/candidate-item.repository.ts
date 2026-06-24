import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { CandidateItemEntity } from '../entities/candidate-item.entity';
import { AbstractRepository } from './abstract.repository';

@Injectable()
export class CandidateItemsRepository extends AbstractRepository<CandidateItemEntity> {
  constructor(@InjectDataSource('postgres') protected readonly dataSource: DataSource) {
    super(CandidateItemEntity, dataSource);
  }

  /** The shared objective Candidate Item set for a Source (ADR-0001). */
  findBySourceId(sourceId: string): Promise<CandidateItemEntity[]> {
    return this.find({ where: { sourceId } });
  }
}
