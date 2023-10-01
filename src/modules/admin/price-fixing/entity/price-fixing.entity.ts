import { CommonEntity } from 'src/authentication/common';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class PriceFixingEntity extends CommonEntity {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    comment: 'primary id for this table',
  })
  id: number;

  @Column({ type: 'bigint', nullable: true })
  price: number;

  @Column({ type: 'bigint', nullable: true })
  quantity: number;
}
