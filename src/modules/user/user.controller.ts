import { Controller, Post, Body, UseGuards, Get, Put, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from 'src/authentication/auth/auth.service';
import { AuthDto, ChangeForgotPassDto, ForgotPassDto, LoginDto, OtpVerifyDto, ResendOtpDto } from 'src/authentication/auth/dto';
import { UpdateUserDto } from 'src/authentication/auth/dto/update-user.dto';
import { AtGuard, RtGuard } from 'src/authentication/auth/guards';
import { PaginationDataDto } from 'src/authentication/common/dtos';
import { UserTypesEnum } from 'src/authentication/common/enum';
import { UserInterface } from 'src/authentication/common/interfaces';
import { PublicRoute, UserPayload } from 'src/authentication/utils/decorators';
import { PlanService } from '../admin/plan/plan.service';

//swagger doc
@ApiTags('RB|User')
//guards
// @ApiBearerAuth('jwt')
// @UseGuards(JwtAuthGuard)
@Controller({
  //path name
  path: 'user',
  //route version
  version: '1',
})
export class UserController {

  constructor(
    private readonly authService: AuthService,
    private readonly planService: PlanService,
  ) {}

  // user registration
  @PublicRoute()
  @Post('local/signup')
  async signupLocal(@Body() authDto: AuthDto) {
    const data = await this.authService.signupLocal(authDto);

    return { message: 'Successful', result: data };
  }

  
  //verify otp data
  @ApiOperation({
    summary: 'verify email otp code',
    description:
      'this route is responsible for verifying email OTP code that is sent to user',
  })
  @ApiBody({
    type: OtpVerifyDto,
    description:
      'How to verify email otp code with body?... here is the example given below!',
    examples: {
      a: {
        summary: 'default',
        value: {
          otpCode: '35FF0C',
          userTypeSlug: UserTypesEnum.USER,
        } as unknown as OtpVerifyDto,
      },
    },
  })
  @Post('verify/otp')
  async verifyOtp(@Body() otpDataDto: OtpVerifyDto) {
    const data = await this.authService.verifyOtp(otpDataDto);
    return { message: 'successful', result: data };
  }

  
   //resend otp code
   @ApiOperation({
    summary: 'resend user otp code',
    description: 'this route is responsible for resend otp code',
  })
  @ApiBody({
    type: ResendOtpDto,
    description:
      'How to resend otp code with body?... here is the example given below!',
    examples: {
      a: {
        summary: 'default',
        value: {
          email: 'noman@gmail.com',
          userTypeSlug: 'user',
        } as unknown as ResendOtpDto,
      },
    },
  })
  @Post('resend/otp-code')
  async resendOtp(@Body() resendOtpDto: ResendOtpDto) {    
    const data = await this.authService.resendOtp(resendOtpDto);
    return { message: 'successful', result: data };
  }


  @PublicRoute()
  @Post('local/signin')
  async signinLocal(@Body() dto: LoginDto): Promise<any> {
    const data = await this.authService.signinLocal(dto);
    return { message: 'Successful', result: data };
  }
  
  @ApiBearerAuth('jwt')
  @UseGuards(AtGuard)
  @Get()
  async getUser(@UserPayload() user: UserInterface) {
    const data = await this.authService.findUserById(user);

    return { message: 'Successful', result: data };
  }

  
  // pagination all user data
  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: 'pagination of all user data',
    description:
      'this route is responsible for showing paginated all user data',
  })
  @ApiBody({
    type: PaginationDataDto,
    description:
      'How to paginate get all data with pagination?... here is the example given below!',
    examples: {
      a: {
        summary: 'default',
        value: {
          filter: {},
          sortOrder: 'ASC',
          sortField: 'id',
          pageNumber: 1,
          pageSize: 10,
        } as unknown as PaginationDataDto,
      },
    },
  })
  @UseGuards(AtGuard)
  @Post('all/user')
  async getAllData(
    @Body() paginationDataDto: PaginationDataDto,
    @UserPayload() userPayload: UserInterface,
  ) {
    const data = await this.authService.findAllUser(
      paginationDataDto,
      userPayload,
    );
    return {
      message: 'successful!',
      result: data,
    };
  }

  
  /**
   *  UPDATE USER Profile
   */
  @ApiBearerAuth('jwt')
  @UseGuards(AtGuard)
  @Put()
  @ApiOperation({
    summary: 'Update a SUBSCRIBER User data',
    description: 'This route is responsible for updating a SUBSCRIBER User',
  })
  @ApiBody({
    type: UpdateUserDto,
    description:
      'How to update an user with body?... here is the example given below!',
    examples: {
      a: {
        summary: 'default',
        value: {
          name: 'string',
          mobile: 'string',
          gender: 'female',
          maritalStatus: 'married',
          birthDate: '2022-03-02',
          address: 'string',
        } as unknown as UpdateUserDto,
      },
    },
  })
  async updateUser(
    @Body() updateUserDto: UpdateUserDto,
    @UserPayload() userPayload: UserInterface,
  ) {    
    const data = await this.authService.updateUserProfile(
      updateUserDto,
      userPayload,
    );
    return { message: 'Successful', result: data };
  }

  // delete user
  @ApiBearerAuth('jwt')
  @UseGuards(AtGuard)
  @Delete()
  async delete(@UserPayload() user: UserInterface) {
    const data = await this.authService.deleteUser(user);

    return { message: 'Successful', result: data };
  }



  // // change password
  // @ApiBearerAuth('jwt')
  // @ApiOperation({
  //   summary: 'change authenticated users password',
  //   description:
  //     'this route is responsible for changing password for all type of users',
  // })
  // @ApiBody({
  //   type: ChangePasswordDto,
  //   description:
  //     'How to change password with body?... here is the example given below!',
  //   examples: {
  //     a: {
  //       summary: 'default',
  //       value: {
  //         oldPassword: '123456',
  //         password: '123456',
  //         passwordConfirm: '123456',
  //       } as unknown as ChangePasswordDto,
  //     },
  //   },
  // })
  // @UseGuards(AtGuard)
  // @Post('change-password')
  // async changePassword(
  //   @Body() changePasswordData: ChangePasswordDto,
  //   @UserPayload() userPayload: UserInterface,
  // ) {
  //   const data = await this.userService.passwordChanged(
  //     changePasswordData,
  //     userPayload,
  //   );

  //   return { message: 'Successful', result: data };
  // }

  //forgot password route
  @PublicRoute()
  @ApiOperation({
    summary: 'request for forgot password',
    description: 'this route is responsible for requsiting for forgot password',
  })
  @ApiBody({
    type: ForgotPassDto,
    description:
      'How to forgot password with body?... here is the example given below!',
    examples: {
      a: {
        summary: 'default',
        value: {
          email: 'noman@gmail.com',
        } as unknown as ForgotPassDto,
      },
    },
  })
  @Post('forgot-password')
  async forgotPassword(@Body() forgotPassDto: ForgotPassDto) {
    const data = await this.authService.forgotPass(forgotPassDto);

    return { message: 'successful', result: data };
  }

  //change password through forgotpass
  @PublicRoute()
  @ApiOperation({
    summary: 'change password by forgot pass',
    description:
      'this route is responsible to change password that requested by forgot password',
  })
  @ApiBody({
    type: ChangeForgotPassDto,
    description:
      'How to change password by forgot pass with body?... here is the example given below!',
    examples: {
      a: {
        summary: 'default',
        value: {
          passResetToken: '2vAzIwDFKn9mV12Ejod9',
          password: '123456',
          passwordConfirm: '123456',
        } as unknown as ChangeForgotPassDto,
      },
    },
  })
  @Post('change/password')
  async changeForgotPassword(@Body() changeForgotPassDto: ChangeForgotPassDto) {
    const data = await this.authService.changePasswordByForgotPass(
      changeForgotPassDto,
    );
    return { message: 'successful', result: data };
  }

  // logout api
  @ApiBearerAuth('jwt')
  @UseGuards(AtGuard)
  @ApiOperation({
    summary: 'for logout, use this api',
    description: 'this route is responsible for logout from an subscriber user',
  })
  @Post('logout')
  async logout(
    @UserPayload() user: UserInterface,
  ) {
    const data = await this.authService.logout(user);

    return { message: 'Successful', result: data };
  }

  // refresh the access token of admin

  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: 'access token need to be refreshed',
    description: 'this route is responsible for access token refreshed',
  })
  @UseGuards(RtGuard)
  @Post('refresh')
  async refreshTokens(
    @UserPayload() userPayload: any,
    @UserPayload('refreshToken') refreshToken: string,
  ): Promise<any> {
    const data = await this.authService.updateRtHashUser(
      userPayload.id,
      refreshToken,
    );

    return { message: 'Successful', result: data };
  }

  
    // get all plan data for user with paginaiton
    @ApiBearerAuth('jwt')
    @UseGuards(AtGuard)
    @ApiOperation({
      summary: 'get all plan data with pagination',
      description:
        'this route is responsible for getting all plan data with pagination',
    })
    @ApiBody({
      type: PaginationDataDto,
      description:
        'How to get plan data with pagination body?... here is the example given below.',
      examples: {
        a: {
          summary: 'default',
          value: {
            filter: {},
            sortOrder: 'ASC || DESC',
            sortField: 'id',
            pageNumber: 1,
            pageSize: 10,
          } as unknown as PaginationDataDto,
        },
      },
    })
    @Post('plan/all')
    async getPaginatedData(@Body() paginationDataDto: PaginationDataDto, @UserPayload() userPayload: UserInterface,
    ) {
      const data = await this.planService.paginatedPlanForUser(paginationDataDto, userPayload);
      return { message: 'successful!', result: data };
    }

}
