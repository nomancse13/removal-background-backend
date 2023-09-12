import { CommonEntity } from 'src/authentication/common';
import { TimeIntervalEnum } from 'src/authentication/common/enum';
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

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', default: 0 })
  isActive: number;

  @Column({ type: 'bigint', nullable: true })
  price: number;

  @Column({ type: 'bigint', nullable: true })
  quantity: number;

  // @Column({ type: 'varchar', length: 150, default: 'USD' })
  // currency: string;

  // @Column({ type: 'bigint', nullable: true })
  // periodInterval: number;

  // @Column({ type: 'varchar', length: 255, nullable: true })
  // timePeriod: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  duration: string;

  // @Column({
  //   type: 'enum',
  //   enum: TimeIntervalEnum,
  //   default: TimeIntervalEnum.DAYS,
  // })
  // timeInterval: string;

  // @Column({ type: 'json', nullable: true })
  // features: string;
}
