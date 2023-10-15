import { CommonEntity } from 'src/authentication/common';
import {
  PackagePeriodEnum,
  TimeIntervalEnum,
} from 'src/authentication/common/enum';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('plan')
export class PlanEntity extends CommonEntity {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    comment: 'primary id for the table',
  })
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  slug: string;

  @Column({ type: 'int', default: 0 })
  isActive: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number;

  @Column({ type: 'bigint', nullable: true })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  perImgCost: number;

  @Column({
    type: 'enum',
    enum: PackagePeriodEnum,
    default: PackagePeriodEnum.FREE,
  })
  packagePeriod: string;
}
