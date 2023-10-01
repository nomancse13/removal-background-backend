// src/background-removal/background-removal.controller.ts
import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as path from 'path';
import { diskStorage } from 'multer';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AtGuard } from 'src/authentication/auth/guards';
import {
  IpPlusClientAddress,
  UserPayload,
} from 'src/authentication/utils/decorators';
// import { UserInterface } from 'src/authentication/common/interfaces';
import { IpClientInterface } from 'src/authentication/common/interfaces/ip-client.interface';
import { BackgroundRemovalService } from 'src/background-removal-img/background-remove.service';
// import imageSize from 'image-size';
// import * as fs from 'fs';

@ApiTags('Public | Remove Background')
@Controller({
  path: 'background-remove',
  version: '1',
})
export class PublicBackgroundRemoveController {
  constructor(
    private readonly backgroundRemovalService: BackgroundRemovalService,
  ) {}

  // remove background

  // @Post()
  // async removeBackground(file: Express.Multer.File, @UserPayload() user: UserInterface) {

  //   const inputImagePath = file.path;
  //   const outputImagePath = Date.now() + '.jpg'; // Provide the desired output path

  //   const success = await this.backgroundRemovalService.myRemoveBgFunction(inputImagePath, outputImagePath, user);
  //   console.log(success, 'succes');

  //   if (success) {
  //     return { message: 'Background removed successfully' };
  //   } else {
  //     return { message: 'Background removal failed' };
  //   }
  // }

  //  upload remove project
  @ApiOperation({
    summary: 'for removing background of an image. use this api',
    description:
      'this route is responsible for removing background of an image',
  })
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: 'public/img',
        filename: (req, file, cb) => {
          cb(null, file.originalname);
        },
      }),
    }),
  )
  async removeBackgroundDemo(
    @UploadedFile() file: Express.Multer.File,
    @IpPlusClientAddress() ipClientPayload: IpClientInterface,
  ) {
    const inputImagePath = file.path;
    const outputImagePath = Date.now() + '.jpg'; // Provide the desired output path

    const success =
      await this.backgroundRemovalService.removeBgFunctionForPublic(
        inputImagePath,
        outputImagePath,
        ipClientPayload,
      );

    // const dimension = imageSize(success);

    // console.log(dimension, 'dimension');

    if (success) {
      // const data = success.replace(/^data:image\/\w+;base64,/, '');
      // const filename = 'image.png'; // Change the file extension based on the image type

      // Write the Base64 data to a file
      // fs.writeFileSync(filename, data, { encoding: 'base64' });
      return { message: 'Background removed successfully', result: success };
    } else {
      return { message: 'Background removal failed' };
    }
  }

  // upload file
  //   @Post('upload/file')
  //   @UseInterceptors(
  //     FileInterceptor('file', {
  //       storage: diskStorage({
  //         destination: 'public/img',
  //         filename: (req, file, cb) => {
  //           cb(null, file.originalname);
  //         },
  //       }),
  //     }),
  //   )
  //   async fileUpload(@UploadedFile() file: Express.Multer.File, @UserPayload() user: UserInterface, @IpPlusClientAddress() ipClientPayload: IpClientInterface,

  //   ) {

  //     return {
  //       statusCode: 200,
  //       data: file.path,
  //     };

  //   }
}
