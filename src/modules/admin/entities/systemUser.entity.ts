/**dependencies */
import { CommonEntity } from 'src/authentication/common';
import { UserTypesEnum } from 'src/authentication/common/enum';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
/**common entity data */
@Entity('systemuser_old')
export class SystemUserEntity extends CommonEntity {
  @PrimaryGeneratedColumn({})
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  mobile: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  hashedRt: string;

  @Column({ type: 'varchar', length: 255, default: UserTypesEnum.ADMIN })
  userType: string;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  gender: string;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  maritalStatus: string;

  @Column({ type: 'date', nullable: true })
  birthDate?: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  address: string;

  @Column({ type: 'bigint', nullable: true })
  profileImageId: number;
}
