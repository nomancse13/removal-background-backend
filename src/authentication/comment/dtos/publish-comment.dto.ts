import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class PublishCommentDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber({}, { each: true })
  readonly commentIds: number[];
}
