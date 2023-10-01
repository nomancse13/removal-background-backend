import { CommonEntity } from 'src/authentication/common';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ActivityLogEntity extends CommonEntity {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    comment: 'primary id for the table',
  })
  id: number;

  @Column({ type: 'varchar', length: 255 })
  ipAddress: string;

  @Column({ type: 'varchar', length: 255 })
  browser: string;

  @Column({ type: 'bigint', nullable: true })
  userId: number;

  // @Column({ type: 'bigint', nullable: true })
  // quantity: number;

}
