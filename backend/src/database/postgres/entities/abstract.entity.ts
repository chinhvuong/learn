import {
  BeforeInsert,
  BeforeUpdate,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  VersionColumn,
  BaseEntity,
} from 'typeorm';

export abstract class AbstractEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // 1. Soft Delete - prevent data loss when deleting data
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt?: Date;

  // 2. Optimistic Locking - prevent race condition when syncing data
  @VersionColumn({ name: 'version', default: 1 })
  version: number;

  @BeforeInsert()
  protected setCreatedAt() {
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  @BeforeUpdate()
  protected setUpdatedAt() {
    this.updatedAt = new Date();
  }
}

/**
 * AbstractEntityWithoutSoftDelete - Base entity without soft delete functionality
 * Use this for entities where soft delete overhead is not needed (e.g., statistics tables)
 * This avoids the automatic WHERE deleted_at IS NULL filter that TypeORM adds to queries
 */
export abstract class AbstractEntityWithoutSoftDelete extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // Optimistic Locking - prevent race condition when syncing data
  @VersionColumn({ name: 'version', default: 1 })
  version: number;

  @BeforeInsert()
  protected setCreatedAt() {
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  @BeforeUpdate()
  protected setUpdatedAt() {
    this.updatedAt = new Date();
  }
}
