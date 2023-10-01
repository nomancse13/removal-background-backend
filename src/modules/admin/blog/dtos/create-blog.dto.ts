import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { StatusField } from 'src/authentication/common/enum';


export class CreateBlogDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly title: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  summary: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly content: string;

  // @ApiProperty()
  // @IsNotEmpty()
  // @IsString()
  // readonly featureImageSrc: string;

  // @ApiProperty({ enum: BlogFormatEnum })
  // @IsEnum(BlogFormatEnum)
  // @IsNotEmpty()
  // readonly format: BlogFormatEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metaTitle: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metaDescription: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metaKeyword: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  publishDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  isFeatured: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  isMustRead: number;

  @ApiPropertyOptional()
  @IsOptional()
  file: any;

  @ApiPropertyOptional({ enum: StatusField })
  @IsEnum(StatusField)
  @IsOptional()
  status: StatusField;
}
