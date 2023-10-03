/**dependencies */
import { CommonEntity } from 'src/authentication/common';
import { UserTypesEnum } from 'src/authentication/common/enum';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
/**common entity data */
@Entity('user')
export class UserEntity extends CommonEntity {
  @PrimaryGeneratedColumn({})
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  mobile: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  hashedRt: string;

  @Column({ type: 'varchar', length: 255, default: UserTypesEnum.USER })
  userType: string;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  gender: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  profileImgSrc: string;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  maritalStatus: string;

  @Column({
    type: 'varchar',
    length: 20,
    comment: 'verification otp',
    nullable: true,
  })
  otpCode: string;

  @Column({
    type: 'timestamp',
    comment: 'verification otp expire time',
    nullable: true,
  })
  otpExpiresAt: Date;

  @Column({ type: 'date', nullable: true })
  birthDate?: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  address: string;

  @Column({ type: 'varchar', length: '255', nullable: true, select: false })
  passResetToken: string;

  @Column({ type: 'timestamp', nullable: true, select: false })
  passResetTokenExpireAt: Date;

  @Column({ type: 'bigint', nullable: true })
  profileImageId: number;

  @Column({ type: 'uuid', nullable: true })
  apiKey: string;

  @Column({ type: 'bigint', nullable: true })
  quantity: number;
}
