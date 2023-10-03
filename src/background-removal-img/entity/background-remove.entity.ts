import { CommonEntity } from 'src/authentication/common';
import { TimeIntervalEnum } from 'src/authentication/common/enum';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('background_remove')
export class BackgroundRemoveEntity extends CommonEntity {
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

  @Column({ type: 'bigint', nullable: true })
  quantity: number;

  // @Column({ type: 'varchar', length: 255 })
  // imgSrc: string;
}
