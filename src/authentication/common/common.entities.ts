import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Timestamp,
  UpdateDateColumn,
} from 'typeorm';
import { StatusField } from './enum';
import { UserTypesEnum } from './enum/user-types.enum';

export abstract class CommonEntity {
  @CreateDateColumn()
  createdAt: Timestamp;

  @UpdateDateColumn({ nullable: true })
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt?: Timestamp;

  @Column({
    type: 'enum',
    enum: UserTypesEnum,
    default: UserTypesEnum.ADMIN,
  })
  createdType: string;

  @Column({
    type: 'enum',
    enum: UserTypesEnum,
    nullable: true,
  })
  updatedType: string;

  @Column({ type: 'int', nullable: true })
  createdBy: number;

  @Column({ type: 'int', nullable: true })
  updatedBy: number;

  @Column({ type: 'int', nullable: true })
  deletedBy: number;

  @Column({
    type: 'enum',
    enum: StatusField,
    default: StatusField.ACTIVE,
  })
  status: string;
}
