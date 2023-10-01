import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateIf,
} from 'class-validator';
import { UserTypesEnum } from 'src/authentication/common/enum';

export class CreateCommentDto {

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly referenceId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly blogId: number;

  @ApiProperty({
    enum: [
      UserTypesEnum.USER,
      UserTypesEnum.CLIENT,
      'guest',
    ],
  })
  @IsNotEmpty()
  @IsEnum([
    UserTypesEnum.USER,
    UserTypesEnum.CLIENT,
    'guest',
  ])
  readonly userType: string;

  @ApiProperty({ description: 'required if userType is not guest' })
  @ValidateIf((e) => e.userType !== 'guest')
  @IsNotEmpty()
  @IsNumber()
  readonly userId: number;

  @ApiProperty()
  @ValidateIf((o) => o.userType === 'guest')
  @IsNotEmpty()
  @IsString()
  userName: string;

  @ApiProperty()
  @ValidateIf((o) => o.userType === 'guest')
  @IsNotEmpty()
  @IsEmail()
  userEmail: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly content: string;
}
