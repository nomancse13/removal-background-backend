import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { PackagePeriodEnum } from 'src/authentication/common/enum';

export class CreatePlanDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  isActive: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  perImgCost: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  price: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(PackagePeriodEnum)
  packagePeriod: PackagePeriodEnum;
}
