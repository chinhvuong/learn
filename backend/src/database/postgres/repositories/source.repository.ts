import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { SourceEntity } from '../entities/source.entity';
import { AbstractRepository } from './abstract.repository';

@Injectable()
export class SourcesRepository extends AbstractRepository<SourceEntity> {
  constructor(@InjectDataSource('postgres') protected readonly dataSource: DataSource) {
    super(SourceEntity, dataSource);
  }

  /**
   * Hybrid-fingerprint lookup (ADR-0001): match on the authoritative
   * content-hash OR the fast-path normalized URL. Either match is a cache hit
   * that lets the engine skip re-analysis.
   */
  findByFingerprint(
    contentHash: string,
    normalizedUrl: string | null,
  ): Promise<SourceEntity | null> {
    const where: Array<Record<string, string>> = [{ contentHash }];
    if (normalizedUrl) {
      where.push({ normalizedUrl });
    }
    return this.findOne({ where });
  }
}
