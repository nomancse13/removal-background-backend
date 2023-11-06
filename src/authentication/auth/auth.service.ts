import { BadRequestException, Injectable } from '@nestjs/common';
import {
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common/exceptions';
import { ConfigService } from '@nestjs/config';
import * as randomToken from 'rand-token';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { decrypt, encrypt } from 'src/helper/crypto.helper';
import {
  AddHoursIntoDateTime,
  checkIsSameOrAfterNowDateTime,
} from 'src/helper/date-time-helper';
import { QueueMailDto } from 'src/modules/queue-mail/queue-mail.dto';
import { QueueMailService } from 'src/modules/queue-mail/queue-mail.service';
import { BaseRepository } from 'typeorm-transactional-cls-hooked';
import { AuthDto } from './dto/auth.dto';
import { LoginDto } from './dto/login.dto';
import { UserEntity } from 'src/modules/user/entities';
import { UserService } from 'src/modules/user/user.service';
import { ErrorMessage, StatusField, UserTypesEnum } from '../common/enum';
import {
  Pagination,
  PaginationOptionsInterface,
  UserInterface,
} from '../common/interfaces';
import {
  ChangeForgotPassDto,
  ForgotPassDto,
  OtpVerifyDto,
  ResendOtpDto,
} from './dto';
import { Brackets } from 'typeorm';
import { PaginationDataDto } from '../common/dtos';
import { SystemUserEntity } from 'src/modules/admin/entities';
import { v4 as uuidv4 } from 'uuid';
import { OrderService } from 'src/modules/user/order/order.service';
import { UserBannedDto } from 'src/modules/admin/dtos';
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: BaseRepository<UserEntity>,
    @InjectRepository(SystemUserEntity)
    private sytemUserRepository: BaseRepository<SystemUserEntity>,
    private jwtService: JwtService,
    private readonly queueMailService: QueueMailService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly orderService: OrderService,
  ) {}

  // ********** GENERAL USER ********
  // sign up user
  async signupLocal(dto: AuthDto): Promise<any> {
    const dataCheck = await this.usersRepository.findOne({
      where: {
        email: dto.email,
        userType: dto.userType,
      },
    });

    if (dataCheck) {
      return `this mail is already exist!`;
    } else {
      const secPass = await this.configService.get('GENERATE_SECRET_CODE');
      const otpData = await this.emailVerification(dto.email, dto.name);
      dto['apiKey'] = uuidv4();
      dto['otpCode'] = otpData.otpCode;
      dto['otpExpiresAt'] = otpData.otpExpiresAt;
      dto['status'] = StatusField.DRAFT;
      dto['createdType'] = dto.userType;
      dto.password =
        dto && dto.password && dto.password.length > 1
          ? bcrypt.hashSync(dto.password, 10)
          : bcrypt.hashSync(secPass, 10);

      const insertData = await this.usersRepository.save(dto);
      let tokens;
      if (insertData) {
        const userPayload = {
          userId: insertData.id,
          userType: insertData.userType,
        };
        const data = await this.orderService.byDefaultInsertOrder(userPayload);
        console.log(data, 'ddd');

        tokens = await this.getTokens({
          id: insertData.id,
          email: insertData.email,
          hashType: encrypt(dto.userType),
        });
        await this.updateRtHashUser(
          {
            id: insertData.id,
            email: insertData.email,
          },
          tokens.refresh_token,
        );
      }
      return tokens;
    }
  }

  // sign in
  async signinLocal(loginDto: LoginDto): Promise<any> {
    const userRegCheck = await this.usersRepository.findOne({
      where: {
        email: loginDto.email,
        status: StatusField.DRAFT,
        userType: loginDto.userType,
      },
    });

    if (userRegCheck) {
      throw new BadRequestException(
        'Your Registration process were pending!!!',
      );
    }
    const user = await this.usersRepository.findOne({
      where: {
        email: loginDto.email,
        status: StatusField.ACTIVE,
        userType: loginDto.userType,
      },
    });

    if (!user) throw new ForbiddenException(ErrorMessage.NO_USER_FOUND);

    const passwordMatches = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!passwordMatches) throw new ForbiddenException('Invalid password!');

    const tokens = await this.getTokens({
      id: user.id,
      email: user.email,
      hashType: encrypt(loginDto.userType),
    });
    await this.updateRtHashUser({ id: user.id }, tokens.refresh_token);

    if (tokens) {
      // const mainImage = `../../../assets/png-file/logo.png`;
      const mailData = new QueueMailDto();
      mailData.toMail = user.email;
      mailData.subject = `RB: Login Message`;
      mailData.bodyHTML = `Test Message`;

      // mailData.template = './login';

      // mailData.context = {
      //   imgSrc: mainImage,
      // };
      const test = await this.queueMailService.sendMail(mailData);
    }
    return tokens;
  }

  // sign in for self user
  async signinSelf(loginDto: LoginDto): Promise<any> {
    const user = await this.usersRepository.findOne({
      where: {
        email: loginDto.email,
        status: StatusField.ACTIVE,
        userType: loginDto.userType,
      },
    });

    if (!user) throw new ForbiddenException(ErrorMessage.NO_USER_FOUND);

    const passwordMatches = user.password === loginDto.password;
    if (!passwordMatches) throw new ForbiddenException('Invalid password!');

    const tokens = await this.getTokens({
      id: user.id,
      email: user.email,
      hashType: encrypt(loginDto.userType),
    });
    await this.updateRtHashUser({ id: user.id }, tokens.refresh_token);

    if (tokens) {
      // const mainImage = `../../../assets/png-file/logo.png`;
      const mailData = new QueueMailDto();
      mailData.toMail = user.email;
      mailData.subject = `RB: Login Message`;
      mailData.bodyHTML = `Test Message`;

      // mailData.template = './login';

      // mailData.context = {
      //   imgSrc: mainImage,
      // };
      const test = await this.queueMailService.sendMail(mailData);
    }
    return tokens;
  }

  // get user by id
  async findUserById(userPayload: UserInterface) {
    const data = await this.usersRepository.findOne({
      where: { id: userPayload.id },
    });
    if (!data) throw new ForbiddenException(ErrorMessage.NO_USER_FOUND);
    delete data.password;
    delete data.hashedRt;
    delete data.otpCode;
    delete data.otpExpiresAt;
    return data;
  }
  // get user by uniqueid
  async findUserByUId(uniqueId: string) {
    const data = await this.usersRepository.findOne({
      where: { apiKey: uniqueId },
    });
    if (!data) throw new ForbiddenException(ErrorMessage.NO_USER_FOUND);
    delete data.password;
    delete data.hashedRt;
    delete data.otpCode;
    delete data.otpExpiresAt;
    return data;
  }

  // get single system user
  async findSingleSystemUser(userPayload: UserInterface) {
    const data = await this.sytemUserRepository.findOne({
      where: { id: userPayload.id },
    });
    if (!data) throw new ForbiddenException(ErrorMessage.NO_USER_FOUND);
    delete data.password;
    delete data.hashedRt;
    return data;
  }

  // get user by id
  async userById(userId: number) {
    const data = await this.usersRepository.findOne({
      where: { id: userId },
    });
    if (!data) throw new ForbiddenException(ErrorMessage.NO_USER_FOUND);
    delete data.password;
    delete data.hashedRt;
    delete data.otpCode;
    delete data.otpExpiresAt;
    return data;
  }

  //verify otp data
  async verifyOtp(otpDataDto: OtpVerifyDto) {
    const data = await this.usersRepository.findOne({
      where: {
        otpCode: otpDataDto.otpCode,
      },
    });

    //if data is empty
    if (!data) {
      throw new ForbiddenException('Invalid code or expired!');
    }

    if (checkIsSameOrAfterNowDateTime(data.otpExpiresAt) === true) {
      throw new ForbiddenException(
        'OTP code expired.Please request a new One!',
      );
    }
    const updateData = {
      otpCode: null,
      otpExpiresAt: null,
      status: StatusField.ACTIVE,
    };

    //update the otp fields
    if (data) {
      await this.usersRepository.update({ id: data.id }, updateData);
    }

    return {
      message: `${data.email} verified successfully.Please login to continue!`,
    };
  }

  //resend otp code
  async resendOtp(resendOtpDto: ResendOtpDto) {
    //create  otp data
    const emailOtp = crypto.randomBytes(3).toString('hex').toUpperCase();

    const currentDate = new Date();
    const otpExpiresAt = new Date(currentDate);
    otpExpiresAt.setHours(
      otpExpiresAt.getHours() +
        Number(this.configService.get('OTP_EXPIRATION')),
    );
    const otpData = {};
    otpData['otpCode'] = emailOtp;
    otpData['otpExpiresAt'] = otpExpiresAt;
    //check for existing draft user by email
    const checkExisting = await this.usersRepository.findOne({
      where: {
        email: resendOtpDto.email,
        status: StatusField.DRAFT,
      },
    });
    //insert if the user is new
    if (!checkExisting) {
      throw new ForbiddenException('No user found!');
    } else {
      //update the if the user exist in the system but draft
      await this.usersRepository.update({ id: checkExisting.id }, otpData);
    }

    const userDataReg = {
      name: checkExisting.name,
      email: checkExisting.email,
    };
    //send email
    const mailData = new QueueMailDto();
    // const verificationLink = `${
    //   this.configService.get('APP_ENV') === 'development'
    //     ? this.configService.get('DEV_FRONTEND_DOMAIN')
    //     : this.configService.get('PROD_FRONTEND_DOMAIN')
    // }email-verification?type=${resendOtpDto.userTypeSlug}&email=${
    //   resendOtpDto.email
    // }`;
    // const cdnLink = await this.configService.get('PUBLIC_CDN');
    const mainImage = `../../../assets/png-file/logo.png`;
    mailData.toMail = userDataReg.email;
    mailData.subject = `RB: Email Verification Code`;
    mailData.template = `./verification`;
    mailData.context = {
      name: `${userDataReg.name}`,
      code: emailOtp,
      //   verificationLink: verificationLink,
      imgSrc: mainImage,
    };

    //send email
    await this.queueMailService.sendMail(mailData);

    return `Please check your email at ${resendOtpDto.email}`;
  }

  // update refresh token of user
  async updateRtHashUser(userPayload: any, rt: string) {
    const hash = await bcrypt.hash(rt, 10);
    const updatedData = {
      hashedRt: hash,
    };
    await this.usersRepository.update({ id: userPayload.id }, updatedData);
  }

  // logout user
  async logout(userPayload: UserInterface) {
    const updatedData = {
      hashedRt: null,
    };
    const isUpdated = await this.usersRepository.update(
      { id: userPayload.id },
      updatedData,
    );

    return isUpdated ? true : false;
  }

  // token refresh of user
  async refreshTokens(userId: number, rt: string): Promise<any> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user || !user.hashedRt)
      throw new ForbiddenException(ErrorMessage.NO_USER_FOUND);

    const rtMatches = await bcrypt.compare(rt, user.hashedRt);

    if (!rtMatches) throw new ForbiddenException('Token not matches!');

    const tokens = await this.getTokens({
      id: user.id,
      email: user.email,
      hashType: encrypt(UserTypesEnum.USER),
    });
    await this.updateRtHashUser(user.id, tokens.refresh_token);

    return tokens;
  }

  //   forgot password
  async forgotPass(forgotPassDto: ForgotPassDto) {
    const userData = await this.validateUserByEmail(forgotPassDto.email);

    //generate password reset token
    const randomTokenString = randomToken.generate(20);
    // const paswordResetLink = `${
    //   this.configService.get('APP_ENV') === 'development'
    //     ? this.configService.get('PUBLIC_CDN')
    //     : this.configService.get('PUBLIC_CDN')
    // }reset-password?passResetToken=${randomTokenString}`;
    const paswordResetLink = `
      http://127.0.0.1:3000/user/change-password?passResetToken=${randomTokenString}`;
    //if email validating fails
    if (!userData) {
      throw new NotFoundException(
        `No user found with email associated ${forgotPassDto.email}`,
      );
    }

    //update the data for pass reset
    const forgotPassRestUpdate = await this.updatePassResetToken(
      forgotPassDto,
      randomTokenString,
    );

    if (forgotPassRestUpdate && forgotPassRestUpdate.affected > 0) {
      // const cdnLink = await this.configService.get('PUBLIC_CDN');
      const mainImage = `../../../assets/png-file/logo.png`;

      const mailData = new QueueMailDto();
      mailData.toMail = userData.email;
      mailData.subject = `Reset password instructions for RB account`;
      mailData.template = './forgot-password';
      mailData.context = {
        name: `${userData.name}`,
        resetLink: paswordResetLink,
        imgSrc: mainImage,
      };
      //send password reset link
      const sendMail = await this.queueMailService.sendMail(mailData);
      // if email is not sent then send errors
      if (sendMail != undefined) {
        throw new ConflictException(
          `${ErrorMessage.FAILED_TO_RESET} password!`,
        );
      }
    } else {
      throw new ConflictException(`${ErrorMessage.FAILED_TO_RESET} password!`);
    }
    return forgotPassDto.email;
  }

  //validate user by email
  async validateUserByEmail(email: string) {
    const userData = await this.usersRepository.findOne({
      where: {
        email: email,
      },
    });

    if (!userData) {
      throw new NotFoundException(ErrorMessage.EMAIL_NOT_FOUND);
    }
    delete userData.password;

    return userData;
  }

  //update user pass reset
  async updatePassResetToken(
    forgotPassDto: ForgotPassDto,
    passResetToken: string,
  ) {
    //set pass reset expiry date time
    const currentDate = new Date();
    const passResetExpireAt = new Date(currentDate);
    passResetExpireAt.setHours(
      passResetExpireAt.getHours() +
        Number(this.configService.get('PASS_RESET_EXPIRY', 1)),
    );
    //prepare data to be updated
    const updateData = {};
    updateData['passResetToken'] = passResetToken;
    updateData['passResetTokenExpireAt'] = passResetExpireAt;

    const { email } = forgotPassDto;
    const userData = await this.usersRepository.update(
      { email: email },
      updateData,
    );

    return userData;
  }

  //hash password
  async hashPassword(password: string) {
    return bcrypt.hashSync(password, 10);
  }

  //change password by forgot password
  async changePasswordByForgotPass(changeForgotPassDto: ChangeForgotPassDto) {
    //validate pass reset token data and return user information from it
    const userData = await this.validatePassResetToken(changeForgotPassDto);

    //check for pass reset token expiry
    const currentDate = new Date();

    if (new Date(currentDate) >= userData.passResetTokenExpireAt) {
      throw new ForbiddenException(`Pass Reset ${ErrorMessage.TOKEN_EXPIRED}`);
    }

    //update the password of the user
    const encryptedPassword = await this.hashPassword(
      changeForgotPassDto.password,
    );
    const updatedData = await this.updateUserPasswordData(
      userData.id,
      encryptedPassword,
    );

    //app sign in link
    const signInLink = '#';
    // if (changeForgotPassDto.userTypeSlug == UserTypesEnum.MENTOR) {
    //   signInLink = `${
    //     this.configService.get('APP_ENV') === 'development'
    //       ? this.configService.get('DEV_FRONTEND_MENTOR_DOMAIN')
    //       : this.configService.get('DEV_FRONTEND_MENTOR_DOMAIN')
    //   }/signin`;
    // } else {
    //   signInLink = `${
    //     this.configService.get('APP_ENV') === 'development'
    //       ? this.configService.get('DEV_FRONTEND_DOMAIN')
    //       : this.configService.get('PROD_FRONTEND_DOMAIN')
    //   }/signin`;
    // }
    // const cdnLink = await this.configService.get('PUBLIC_CDN');
    // const mainImage = `${cdnLink}ADMIN/logo-unisearch-67e1c334-cbc7-47cd-80d1-75ac4ed60dbb.png`;
    const mainImage = '#';
    const mailData = new QueueMailDto();
    mailData.toMail = updatedData.email;
    mailData.subject = `RB: Password Changed`;
    mailData.template = './change-password';
    mailData.context = {
      signInLink: signInLink,
      imgSrc: mainImage,
    };
    await this.queueMailService.sendMail(mailData);

    return updatedData.email;
  }

  //validate pass reset token
  async validatePassResetToken(changeForgotPassDto: ChangeForgotPassDto) {
    const { passResetToken } = changeForgotPassDto;
    const userData = await this.usersRepository.findOne({
      where: {
        passResetToken: passResetToken,
      },
    });

    //user data error not found
    if (!userData) {
      throw new NotFoundException(
        `Password reset ${ErrorMessage.INFO_NOT_FOUND}.Please request a new one!`,
      );
    }

    return userData;
  }

  //update user password data
  async updateUserPasswordData(userId: number, encryptedPassword: string) {
    const updateData = {
      password: encryptedPassword,
      passResetToken: null,
      passResetTokenExpireAt: null,
    };

    await this.usersRepository
      .createQueryBuilder()
      .update(UserEntity, updateData)
      .where('id = :id', { id: userId })
      .execute();

    const updatedUser = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!updatedUser) {
      throw new NotFoundException(`${ErrorMessage.UPDATE_FAILED}`);
    }

    return updatedUser;
  }

  // update user
  async updateUserProfile(updateUserDto: any, userPayload: UserInterface) {
    updateUserDto['updatedAt'] = new Date();
    updateUserDto['updatedBy'] = userPayload.id;

    if (updateUserDto?.email) {
      const dataCheck = await this.usersRepository
        .createQueryBuilder('user')
        .where(`user.email='${updateUserDto.email}'`)
        .andWhere(`user.id != ${userPayload.id}`)
        .getOne();

      if (dataCheck) {
        return `Email you provided, already exist. Please fill another email.`;
      }
    }

    const data = await this.usersRepository
      .createQueryBuilder()
      .update(UserEntity, updateUserDto)
      .where(`id = '${userPayload.id}'`)
      .execute();

    if (data.affected === 0) {
      throw new BadRequestException(ErrorMessage.UPDATE_FAILED);
    }

    return `user profile updated successfully!!!`;
  }

  // get user by id
  async getUserById(userId: number) {
    const data = await this.usersRepository.findOne({ where: { id: userId } });
    return data;
  }

  // find all user
  async findAllUser(
    listQueryParam: PaginationOptionsInterface,
    filter: any,
    userPayload: UserInterface,
  ) {
    if (decrypt(userPayload.hashType) !== UserTypesEnum.ADMIN) {
      throw new BadRequestException(
        'You are not allow to see any kind of Blog',
      );
    }
    const limit: number = listQueryParam.limit ? listQueryParam.limit : 10;
    const page: number = listQueryParam.page
      ? +listQueryParam.page == 1
        ? 0
        : listQueryParam.page
      : 1;

    const [result, total] = await this.usersRepository
      .createQueryBuilder('user')
      .where(
        new Brackets((qb) => {
          if (filter) {
            qb.where(`user.name ILIKE ('%${filter}%')`);
          }
        }),
      )
      .orderBy('user.id', 'DESC')
      .take(limit)
      .skip(page > 0 ? page * limit - limit : page)
      .getManyAndCount();

    let results = result.map(
      ({ otpCode, password, otpExpiresAt, hashedRt, ...item }) => item,
    );

    return new Pagination<any>({
      results,
      total,
      currentPage: page === 0 ? 1 : page,
      limit,
    });
  }

  // delete user
  async deleteUser(userPayload: UserInterface) {
    const data = await this.usersRepository.delete({ id: userPayload.id });

    return `deleted successfully!!`;
  }

  // *******Common use api ******

  // get tokens FOR ALL
  async getTokens(userPayload: UserInterface) {
    const payload = {
      id: userPayload.id,
      email: userPayload.email,
      hashType: userPayload.hashType,
    };

    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('AT_SECRET'),
        expiresIn: '10d',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('RT_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
    };
  }

  async emailVerification(email: string, name: string) {
    const emailOtp = crypto.randomBytes(3).toString('hex').toUpperCase();

    const otpExpiresAt = AddHoursIntoDateTime(
      this.configService.get('OTP_EXPIRATION') ?? 2,
    );

    const mailData = new QueueMailDto();
    // const verificationLink = `${
    //   this.configService.get('APP_ENV') === 'development'
    //     ? this.configService.get('DEV_FRONTEND_DOMAIN')
    //     : this.configService.get('PROD_FRONTEND_DOMAIN')
    // }email-verification?type=${userDataReg.userTypeSlug}&email=${
    //   userDataReg.email
    // }`;
    // const cdnLink = await this.configService.get('PUBLIC_CDN');
    const mainImage = `../../../assets/png-file/logo.png`;
    mailData.toMail = email;
    mailData.subject = `RB: Email Verification Code`;
    mailData.template = `./verification`;
    mailData.context = {
      name: name,
      code: emailOtp,
      //   verificationLink: verificationLink,
      imgSrc: mainImage,
    };
    //send email
    await this.queueMailService.sendMail(mailData);

    return {
      otpCode: emailOtp,
      otpExpiresAt: otpExpiresAt,
    };
  }

  // *******For ADMIN USER******

  // update admin
  async updateAdminProfile(updateUserDto: any, userPayload: UserInterface) {
    updateUserDto['updatedAt'] = new Date();
    updateUserDto['updatedBy'] = userPayload.id;

    if (updateUserDto?.email) {
      const dataCheck = await this.usersRepository
        .createQueryBuilder('user')
        .where(`user.email='${updateUserDto.email}'`)
        .andWhere(`user.id != ${userPayload.id}`)
        .getOne();

      if (dataCheck) {
        return `Email you provided, already exist. Please fill another email.`;
      }
    }

    const data = await this.usersRepository
      .createQueryBuilder()
      .update(UserEntity, updateUserDto)
      .where(`id = '${userPayload.id}'`)
      .returning('*')
      .execute();

    if (data.affected === 0) {
      throw new BadRequestException(ErrorMessage.UPDATE_FAILED);
    }

    return 'Admin Profile updated successfully!';
  }

  // sign up admin
  async signupAdmin(dto: AuthDto): Promise<any> {
    const dataCheck = await this.sytemUserRepository.findOne({
      where: {
        email: dto.email,
      },
    });

    if (dataCheck) {
      return `this mail is already exist!`;
    } else {
      const secPass = await this.configService.get('GENERATE_SECRET_CODE');
      dto['status'] = StatusField.ACTIVE;
      dto.password =
        dto && dto.password && dto.password.length > 1
          ? bcrypt.hashSync(dto.password, 10)
          : bcrypt.hashSync(secPass, 10);

      const insertData = await this.sytemUserRepository.save(dto);
      let tokens;
      if (insertData) {
        tokens = await this.getTokens({
          id: insertData.id,
          email: insertData.email,
          hashType: encrypt(UserTypesEnum.ADMIN),
        });
        await this.updateRtHashAdmin(
          {
            id: insertData.id,
            email: insertData.email,
          },
          tokens.refresh_token,
        );
      }
      return tokens;
    }
  }

  // sign in admin
  async signinAdmin(loginDto: LoginDto): Promise<any> {
    const systemUser = await this.sytemUserRepository.findOne({
      where: {
        email: loginDto.email,
        status: StatusField.ACTIVE,
      },
    });

    if (!systemUser) throw new ForbiddenException(ErrorMessage.NO_USER_FOUND);

    const passwordMatches = await bcrypt.compare(
      loginDto.password,
      systemUser.password,
    );
    if (!passwordMatches) throw new ForbiddenException('Invalid password!');

    const tokens = await this.getTokens({
      id: systemUser.id,
      email: systemUser.email,
      hashType: encrypt(UserTypesEnum.ADMIN),
    });
    await this.updateRtHashAdmin({ id: systemUser.id }, tokens.refresh_token);

    if (tokens) {
      const mainImage = `../../../assets/png-file/logo.png`;
      const mailData = new QueueMailDto();
      mailData.toMail = systemUser.email;
      mailData.subject = `RB: Login To Admin`;

      mailData.template = './login';

      mailData.context = {
        imgSrc: mainImage,
      };
      const test = await this.queueMailService.sendMail(mailData);
    }
    return tokens;
  }

  // logout admin
  async logoutAdmin(userPayload: UserInterface) {
    const updatedData = {
      hashedRt: null,
    };
    const isUpdated = await this.sytemUserRepository.update(
      { id: userPayload.id },
      updatedData,
    );

    return isUpdated ? true : false;
  }

  // token refresh admin
  async refreshTokensAdmin(userId: number, rt: string): Promise<any> {
    const systemUser = await this.sytemUserRepository.findOne({
      where: { id: userId },
    });

    if (!systemUser || !systemUser.hashedRt)
      throw new ForbiddenException(ErrorMessage.NO_USER_FOUND);

    const rtMatches = await bcrypt.compare(rt, systemUser.hashedRt);

    if (!rtMatches) throw new ForbiddenException('Token not matches!');

    const tokens = await this.getTokens({
      id: systemUser.id,
      email: systemUser.email,
      hashType: encrypt(UserTypesEnum.ADMIN),
    });
    await this.updateRtHashAdmin(systemUser.id, tokens.refresh_token);

    return tokens;
  }

  // update refresh token of admin
  async updateRtHashAdmin(userPayload: any, rt: string) {
    const hash = await bcrypt.hash(rt, 10);
    const updatedData = {
      hashedRt: hash,
    };
    await this.sytemUserRepository.update({ id: userPayload.id }, updatedData);
  }

  // login to client from user
  async clientLoginFromUser(id: number, userPayload: UserInterface) {
    if (decrypt(userPayload.hashType) !== UserTypesEnum.USER) {
      throw new BadRequestException('You are not allow to access this api');
    }

    const clinetData = await this.usersRepository.findOne({
      where: {
        id: id,
        userType: UserTypesEnum.CLIENT,
        status: 'Active',
      },
    });

    const localLoginDto = {
      email: clinetData.email,
      password: clinetData.password,
      userType: UserTypesEnum.CLIENT,
    };

    const loginToClient = await this.signinSelf(localLoginDto);
    return loginToClient;
  }

  // login to user from client
  async userLoginFromClient(id: number, userPayload: UserInterface) {
    if (decrypt(userPayload.hashType) !== UserTypesEnum.CLIENT) {
      throw new BadRequestException('You are not allow to access this api');
    }

    const userData = await this.usersRepository.findOne({
      where: {
        id: id,
        userType: UserTypesEnum.USER,
        status: 'Active',
      },
    });

    const localLoginDto = {
      email: userData.email,
      password: userData.password,
      userType: UserTypesEnum.USER,
    };

    const loginToClient = await this.signinSelf(localLoginDto);
    return loginToClient;
  }

  //  facebook login
  async facebookLogin(req: any) {
    return req.user;

    // if (!req.user) {
    //   return `no user from google`;
    // }
    // return {
    //   message: 'user info from google',
    //   user: req,
    // };
  }

  // google login
  async googleLogin(req: any, res: Response) {
    return req.user;
  }

  // subsriber user banned by admin
  async bannedUserByAdmin(
    id: number,
    userBannedDto: UserBannedDto,
    userPayload: UserInterface,
  ) {
    if (decrypt(userPayload.hashType) !== UserTypesEnum.ADMIN) {
      throw new NotFoundException('Unknown UserType!');
    }

    const updateData = {
      status: userBannedDto.status,
    };

    const data = await this.usersRepository.update({ id: id }, updateData);

    return data.affected > 0 ? `User Banned Successfully!` : 'Not Banned!';
  }
}
