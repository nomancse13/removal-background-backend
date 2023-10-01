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
      apiKey: 'TozfYk47N3yXX3J7YJUj45Fi', //GrUJJuuXGXofH45mEVFrWTy8
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

  // //upload to s3
  // async uploadS3(files: any, folderName: string) {
  //   const bucketS3 = 'Test Bucket';
  //   //get aws s3 configuration
  //   const s3 = await this.getS3Config();
  //   const afterUploadData = [];
  //   for (let i = 0; i < files.length; i++) {
  //     //set upload parameter
  //     const fileNameData = path.basename(
  //       files[i].originalname,
  //       path.extname(files[i].originalname),
  //     );

  //     const params = {
  //       Bucket: bucketS3,
  //       ACL: 'public-read',
  //       Key: `${folderName}/${fileNameData}-${uuidv4()}${path.extname(
  //         files[i].originalname,
  //       )}`,
  //       Body: Buffer.from(files[i].buffer, 'binary'),
  //       ContentType: files[i].mimetype,
  //     };
  //     const uploadedInfo = await new Promise((resolve, reject) => {
  //       //upload file
  //       s3.upload(params, (err, data) => {
  //         if (err) {
  //           //throw error messages
  //           reject(err.message);
  //           throw new BadRequestException(`File Upload Failed!`);
  //         }
  //         resolve(data);
  //       });
  //     });
  //     afterUploadData.push(uploadedInfo);
  //   }
  //   return afterUploadData;
  // }

  // //set aws s3 configuration
  // async getS3Config() {
  //   return new S3({
  //     accessKeyId: "",
  //     secretAccessKey: await this.configService.get('AWS_SECRET_KEY'),
  //     region: await this.configService.get('AWS_REGION'),
  //   });
  // }
}
