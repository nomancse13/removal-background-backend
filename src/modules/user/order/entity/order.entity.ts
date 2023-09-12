import { CommonEntity } from 'src/authentication/common';
import { SubscriptionStatusEnum } from 'src/authentication/common/enum';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('order')
export class OrderEntity extends CommonEntity {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    comment: 'primary id for the table',
  })
  id: number;

  @Column({
    type: 'bigint',
  })
  userId: number;

  @Column({
    type: 'bigint',
  })
  planId: number;

  @Column({
    type: 'enum',
    enum: SubscriptionStatusEnum,
    default: SubscriptionStatusEnum.PENDING,
  })
  subscriptionStatus: string;

  @Column({ type: 'date', nullable: true })
  packageDate: Date;

  @Column({ type: 'date', nullable: true })
  expiredDate: Date;
}
