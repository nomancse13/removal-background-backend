import { ApiProperty } from '@nestjs/swagger/dist/decorators/api-property.decorator';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { UserTypesEnum } from 'src/authentication/common/enum';

export class LoginDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly password: string;

  @ApiProperty()
  @IsEnum(UserTypesEnum, { each: true })
  @IsString()
  @IsNotEmpty()
  readonly userType: UserTypesEnum;
}
