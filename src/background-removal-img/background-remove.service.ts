import {
  BadRequestException,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
// import * as fs from 'fs';
// import * as remove from 'rembg';
import { RemoveBgResult, removeBackgroundFromImageFile } from 'remove.bg';
import {
  ErrorMessage,
  SubscriptionStatusEnum,
  UserTypesEnum,
} from 'src/authentication/common/enum';
import { UserInterface } from 'src/authentication/common/interfaces';
import { decrypt } from 'src/helper/crypto.helper';
import { UnauthorizedException } from '@nestjs/common/exceptions';
import { OrderService } from 'src/modules/user/order/order.service';
import { InjectRepository } from '@nestjs/typeorm';
import { BackgroundRemoveEntity } from './entity';
import { BaseRepository } from 'typeorm-transactional-cls-hooked';
import { IpClientInterface } from 'src/authentication/common/interfaces/ip-client.interface';
import { ActivityLogService } from 'src/modules/admin/activity-log/activityLog.service';
import imageSize from 'image-size';
import Jimp from 'jimp';
import { AuthService } from 'src/authentication/auth/auth.service';
import { CurrentDate } from 'src/helper/date-time-helper';
// import sharp from 'sharp';
// import { S3 } from 'aws-sdk';
// import * as path from 'path';
// import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BackgroundRemovalService {
  constructor(
    @InjectRepository(BackgroundRemoveEntity)
    private backgroundRemoveRepository: BaseRepository<BackgroundRemoveEntity>,
    @Inject(forwardRef(() => OrderService))
    private readonly orderService: OrderService,
    private readonly authService: AuthService,
    @Inject(forwardRef(() => ActivityLogService))
    private readonly activityLogService: ActivityLogService,
  ) {}

  // background remove function
  async myRemoveBgFunction(
    path: string,
    outputFile: string,
    userPayload?: UserInterface,
  ) {
    if (
      decrypt(userPayload.hashType) !== UserTypesEnum.USER ||
      decrypt(userPayload.hashType) !== UserTypesEnum.CLIENT
    ) {
      throw new UnauthorizedException(ErrorMessage.UNAUTHORIZED);
    }

    const userOrderData: any = await this.orderService.getOrderByUserId(
      userPayload.id,
    );

    if (!userOrderData) {
      throw new BadRequestException(
        `You have not any kind of complete status of order! please complete status and then try again!!`,
      );
    }
    const backgroundRemoveData = await this.backgroundRemoveRepository.findOne({
      where: { userId: userPayload.id, planId: userOrderData?.planId },
    });

    const result: RemoveBgResult = await removeBackgroundFromImageFile({
      path,
      apiKey: 'TozfYk47N3yXX3J7YJUj45Fi',
      size: 'regular',
      type: 'person',
      crop: true,
      scale: '50%',
      outputFile,
    });

    if (
      userOrderData &&
      userOrderData.subscriptionStatus == SubscriptionStatusEnum.COMPLETE &&
      result.base64img
    ) {
      if (userOrderData?.plan && !backgroundRemoveData) {
        const data = {
          userId: userPayload.id,
          planId: userOrderData.planId,
          quantity: 1,
        };
        await this.backgroundRemoveRepository.save(data);
      } else {
        const updatedData = {
          userId: userPayload.id,
          planId: userOrderData.planId,
          quantity: Number(backgroundRemoveData?.quantity) + 1,
        };

        await this.backgroundRemoveRepository.update(
          { userId: userPayload.id, planId: userOrderData.planId },
          updatedData,
        );
      }
    }

    if (
      userOrderData &&
      userOrderData?.plan?.price == 0 &&
      backgroundRemoveData?.quantity > userOrderData?.plan?.quantity
    ) {
      throw new BadRequestException(
        `you are not allow to use any kind of service for free. please enroll a package.`,
      );
    }

    return result.base64img;
  }

  // background remove function for public
  async removeBgFunctionForPublic(
    path: string,
    outputFile: string,
    ipClientPayload?: IpClientInterface,
  ) {
    const dimension = imageSize(path);

    const ipData = await this.activityLogService.getLogCount(
      ipClientPayload.ip,
    );

    if (ipData > 6) {
      throw new BadRequestException(
        `Please register and purchase premium plan then enjoy the service.`,
      );
    }

    const result: RemoveBgResult = await removeBackgroundFromImageFile({
      path,
      apiKey: 'GrUJJuuXGXofH45mEVFrWTy8', //YeECXB6tpkbiAomgHhZDg7rb, cg1afjGNXVHB9XSFe2cVV85F, ZiohBs9WmUm57ZHVThXyByUY, YSCw1Mmwr9KRN62gFQcJDnus
      size: 'regular',
      type: 'person',
      crop: true,
      scale: '50%',
      outputFile,
    });

    if (result) {
      const log = {
        ipAddress: ipClientPayload.ip,
        browser: ipClientPayload.browser,
        userId: 0,
      };

      const image = await Jimp.read(Buffer.from(result.base64img, 'base64'));
      image.resize(dimension.width, dimension.height);

      const mainImage = await image.getBase64Async(Jimp.MIME_JPEG);

      // console.log(mainImage, 'mainImage');

      await this.activityLogService.entryLog(log);
      return mainImage;
    } else {
      throw new BadRequestException('background remove not working!!!!');
    }
  }

  // remove background with api key

  async removeBgByApiKey(path: string, outputFile: string, apiKey: string) {
    const userData = await this.authService.findUserByUId(apiKey);

    const userOrderData: any = await this.orderService.getApiPlanOrderByUserId(
      userData.id,
    );

    console.log(userOrderData, 'userOrder');

    const userCreate = userData.createdAt.toString();

    const today = new Date(userCreate);

    const priorDate = new Date(today.setDate(today.getDate() + 30));

    const dateDiff = Date.parse(priorDate.toDateString()) - Date.now();

    // const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    //  HERE TASK WILL APPLY NEXT DAY

    // if (!userOrderData) {
    //   throw new BadRequestException(
    //     `You have not any kind of complete status of order! please complete the subscription status and then try again!!`,
    //   );
    // }

    if (dateDiff <= 0) {
      throw new BadRequestException(
        `your free time access has been ended!!! please buy some credit and then enjoy the api service`,
      );
    }

    const result: RemoveBgResult = await removeBackgroundFromImageFile({
      path,
      apiKey: 'GrUJJuuXGXofH45mEVFrWTy8', //YeECXB6tpkbiAomgHhZDg7rb, cg1afjGNXVHB9XSFe2cVV85F, ZiohBs9WmUm57ZHVThXyByUY, YSCw1Mmwr9KRN62gFQcJDnus
      size: 'regular',
      type: 'person',
      crop: true,
      scale: '50%',
      outputFile,
    });

    if (result) {
      return result.base64img;
    } else {
      throw new BadRequestException('background remove not working!!!!');
    }
  }
}
