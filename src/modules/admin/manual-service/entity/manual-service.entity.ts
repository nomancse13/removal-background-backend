import { CommonEntity } from 'src/authentication/common';
import {
  PackagePeriodEnum,
  TimeIntervalEnum,
} from 'src/authentication/common/enum';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ManualServiceEntity extends CommonEntity {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    comment: 'primary id for the table',
  })
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'bigint' })
  quantity: number;
}
