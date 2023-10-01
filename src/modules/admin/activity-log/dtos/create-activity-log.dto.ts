import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { TimeIntervalEnum } from 'src/authentication/common/enum';

export class CreateActivityLogDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ipAddress: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  browser: string;

  // @ApiPropertyOptional()
  // @IsOptional()
  // @IsNumber()
  // quantity: number;

  // @ApiPropertyOptional()
  // @IsOptional()
  // @IsNumber()
  // userId: number;

}
