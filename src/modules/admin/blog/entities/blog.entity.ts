import { CommonEntity } from 'src/authentication/common';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('blogs')
export class BlogEntity extends CommonEntity {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    comment: 'primary generated table column',
  })
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 260 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ type: 'varchar', length: 255, nullable: true})
  featureImgSrc: string;

  @Column({ type: 'text' })
  content: string;

  // @Column({
  //   type: 'enum',
  //   default: BlogFormatEnum.STANDARD,
  //   enum: BlogFormatEnum,
  //   enumName: 'BlogFormatEnum',
  // })
  // format: BlogFormatEnum;
  // @Column({ type: 'int', nullable: true })
  // featureImageId: number;

  // @Column({
  //   type: 'enum',
  //   enum: VideoType,
  //   enumName: 'blogVideoTypeEnum',
  //   nullable: true,
  // })
  // videoType: VideoType;

  @Column({ type: 'text', nullable: true })
  metaTitle: string;

  @Column({ type: 'text', nullable: true })
  metaDescription: string;

  @Column({ type: 'text', nullable: true })
  metaKeyword: string;

  @Column({ type: 'date', nullable: true })
  publishDate: Date;

  @Column({ type: 'int', default: 0 })
  isFeatured: number;

  @Column({ type: 'int', default: 0 })
  isMustRead: number;

  @Column({ type: 'bigint', default: 0 })
  totalView: number;
}
