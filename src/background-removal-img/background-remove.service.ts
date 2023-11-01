import {
  BadRequestException,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
// import { RemoveBgResult, removeBackgroundFromImageFile } from 'remove.bg';
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
import { HttpService } from '@nestjs/axios/dist';
// import Jimp from 'jimp';
import { AuthService } from 'src/authentication/auth/auth.service';
// import RemoveBackground from 'remove-bg-node';
// import removd from 'removd';
// import axios, { AxiosResponse } from 'axios';
// import { lastValueFrom, map, Observable } from 'rxjs';
// import rembg from '@remove-background-ai/rembg.js';
// import * as sharp from 'sharp';
// import { Rembg } from 'rembg-node';
import { exec } from 'child_process';
// import Photoroom from 'photoroom-sdk';
// import * as fs from 'fs-extra';
// import PdfOcr from 'node-pdf-ocr';
// import * as tesseract from 'node-tesseract-ocr/src/index';
import * as pdfjsLib from 'pdfjs-dist';
// import imglyRemoveBackground, { Config } from '@imgly/background-removal';
// import { removeBackground } from '@imgly/background-removal';
import { promisify } from 'util';
import { readFile, unlink } from 'fs/promises';

const execAsync = promisify(exec);

@Injectable()
export class BackgroundRemovalService {
  constructor(
    @InjectRepository(BackgroundRemoveEntity)
    private backgroundRemoveRepository: BaseRepository<BackgroundRemoveEntity>,
    @Inject(forwardRef(() => OrderService))
    private readonly orderService: OrderService,
    private readonly authService: AuthService,
    private readonly httpService: HttpService,
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

    let current = path;
    let save = outputFile;
    const img = await this.asyncRemoveBackground(current, save);

    if (
      userOrderData &&
      userOrderData.subscriptionStatus == SubscriptionStatusEnum.COMPLETE &&
      img
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

    return img;
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

    let current = path;
    let save = outputFile;
    const img = await this.asyncRemoveBackground(current, save);

    if (img) {
      const log = {
        ipAddress: ipClientPayload.ip,
        browser: ipClientPayload.browser,
        userId: 0,
      };

      // const image = await Jimp.read(Buffer.from(result.base64img, 'base64'));
      // image.resize(dimension.width, dimension.height);

      // const mainImage = await image.getBase64Async(Jimp.MIME_JPEG);

      await this.activityLogService.entryLog(log);
      return img;
    } else {
      throw new BadRequestException('background remove not working!!!!');
    }
  }

  // remove background with api key

  async removeBgByApiKey(path: string, outputFile: string, apiKey: string) {
    const userData = await this.authService.findUserByUId(apiKey);

    if (!userData) {
      throw new BadRequestException(`apikey you provided is not matched!`);
    }

    const userOrderData: any = await this.orderService.getApiPlanOrderByUserId(
      userData.id,
    );

    if (!userOrderData) {
      throw new BadRequestException(
        `sorry. your free trial has been finished. please enrolled one.`,
      );
    }

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

    let current = path;
    let save = outputFile;
    const img = await this.asyncRemoveBackground(current, save);

    if (img) {
      return img;
    } else {
      throw new BadRequestException('background remove not working!!!!');
    }
  }

  //
  async removeBackground(path: any, outputFile: string): Promise<any> {
    const file = path.filename;

    if (file.indexOf(' ') !== -1) {
      throw new BadRequestException(`please avoid space in file name!!`);
    }

    // try {
    // 1st approach
    // const onDownloadProgress = console.log;
    // const onUploadProgress = console.log;
    // rembg({
    //   apiKey: '1569cd7e-8bb0-469e-b73b-b7c6e75e3ba1',
    //   inputImagePath: path.path,
    //   onDownloadProgress,
    //   onUploadProgress,
    // }).then(({ outputImagePath, cleanup }) => {
    //   console.log(
    //     `✅🎉 background removed and saved under path=${outputImagePath}`,
    //   );
    //   // if called, it will cleanup (remove from disk) your removed background image
    //   // cleanup();
    // });
    // ______2nd approach free______
    // const input = sharp(path.path);
    // // optional arguments
    // const rembg = new Rembg({
    //   logging: true,
    // });
    // const output = await rembg.remove(input);
    // await output.webp().toFile('test-output.webp');
    // // optionally you can use .trim() too!
    // await output.trim().webp().toFile('test-output-trimmed.webp');
    // ______3rd approach free______
    let current = path.path;
    let save = outputFile;
    const img = await this.asyncRemoveBackground(current, save);

    return img;
    // ______4th approach free______
    // const done = await removd.file({
    //   source: path.path,
    // });
    // return done;
    // ______5th approach paid version______
    // const photoroom = new Photoroom('6b9438dc4b10ba060b1df0523b763f606d10720d');
    // const base64Data = await fs.readFile(path.path, 'base64');
    // const response = photoroom.removeBgFromImage({
    //   image_file_b64: base64Data,
    //   bg_color: 'blue',
    // });
    // ______6th approach paid version______
    // let image_src: ImageData | ArrayBuffer | Uint8Array | Blob | URL | string =
    //   path.path;
    // console.log(image_src, 'immmm');
    // const img = await removeBackground(image_src).then((blob: Blob) => {
    //   console.log('noman');
    //   // The result is a blob encoded as PNG. It can be converted to an URL to be used as HTMLImage.src
    // });
    // console.log(img, 'immmass');
    // return img;
    // const config = {
    //   lang: 'eng',
    //   oem: 1,
    //   psm: 3,
    // };
    // console.log(tesseract, 'teetes');
    // tesseract
    //   .recognize(path.path, config)
    //   .then((text) => {
    //     console.log('Result:', text);
    //   })
    //   .catch((error) => {
    //     console.log(error.message);
    //   });
    // const data = await this.GetTextFromPDF(path.path).then((data) =>
    //   console.log(data, 'doerjl'),
    // );
    // console.log(data, 'ddd');
    // return data;
    // like saving into a file
    // fs.writeFileSync(
    //   `${__dirname}/img-bg-removed.jpg`,
    //   response.result_b64.replace(/^data:image\/\w+;base64,/, ''),
    //   { encoding: 'base64' },
    // );
    // } catch (error) {
    //   throw new Error(`Failed to remove the background: ${error.message}`);
    // }
  }

  async GetTextFromPDF(path: any) {
    console.log(pdfjsLib, 'pppd');

    let doc = await pdfjsLib.getDocument(path).promise;
    let page1 = await doc.getPage(1);
    let content = await page1.getTextContent();
    let strings = content.items.map(function (item: any) {
      return item.str;
    });
    return strings;
  }

  // package function
  async asyncRemoveBackground(current: string, save: string) {
    try {
      let command = `rembg i ${current} ${save}`;

      const { stdout, stderr } = await execAsync(command);

      if (stderr) {
        throw new Error('An error occurred during background removal');
      }

      // Read the saved image file as a Buffer
      const savedImageBuffer = await readFile(save);

      // Convert the Buffer to a Base64-encoded string
      const base64Image = savedImageBuffer.toString('base64');

      // Clean up the saved file
      await unlink(save);

      return base64Image;
    } catch (error) {
      throw new Error(`Error: ${error.message}`);
    }
  }
}
