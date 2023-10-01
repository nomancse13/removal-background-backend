import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCustomPackageDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  totalCost: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  quantity: number;
}
