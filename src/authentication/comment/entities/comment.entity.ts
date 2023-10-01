import { CommonEntity } from 'src/authentication/common';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Timestamp,
} from 'typeorm';

@Entity('comments')
export class CommentEntity extends CommonEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', default: 0 })
  referenceId: number;

  @Column({ type: 'varchar', length: 100 })
  userType: string;

  @Column({ type: 'bigint', default: 0 })
  userId: number;

  @Column({ type: 'int', nullable: true })
  blogId: number;

  @Column({ type: 'varchar', length: 100 })
  userName: string;

  @Column({ type: 'varchar', length: 100 })
  userEmail: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'bigint' })
  isPublished: number;
}
