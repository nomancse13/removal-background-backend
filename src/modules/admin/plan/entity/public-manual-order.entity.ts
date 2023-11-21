import { CommonEntity } from 'src/authentication/common';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class PublicManualOrderEntity extends CommonEntity {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    comment: 'primary id for the table',
  })
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  src: any;
}
