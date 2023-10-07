// src/background-removal/background-removal.controller.ts
import {
  Controller,
  Post,
  UploadedFile,
  Get,
  UseGuards,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BackgroundRemovalService } from './background-remove.service';
import * as path from 'path';
import { diskStorage } from 'multer';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AtGuard } from 'src/authentication/auth/guards';
import { UserPayload } from 'src/authentication/utils/decorators';
import { UserInterface } from 'src/authentication/common/interfaces';

@ApiTags('User | Remove Background')
@ApiBearerAuth('jwt')
// @UseGuards(AtGuard)
@Controller({
  path: 'background-remove',
  version: '1',
})
export class BackgroundRemovalController {
  constructor(
    private readonly backgroundRemovalService: BackgroundRemovalService,
  ) {}

  // remove background

  @Post()
  async removeBackground(
    file: Express.Multer.File,
    @UserPayload() user: UserInterface,
  ) {
    const inputImagePath = file.path;
    const outputImagePath = Date.now() + '.jpg'; // Provide the desired output path

    const success = await this.backgroundRemovalService.myRemoveBgFunction(
      inputImagePath,
      outputImagePath,
      user,
    );

    if (success) {
      return { message: 'Background removed successfully' };
    } else {
      return { message: 'Background removal failed' };
    }
  }

  //  upload remove project
  @ApiOperation({
    summary: 'for removing background of an image. use this api',
    description:
      'this route is responsible for removing background of an image',
  })
  @Post('upload/remove')
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
    @UserPayload() user: UserInterface,
  ) {
    const inputImagePath = file.path;
    const outputImagePath = Date.now() + '.jpg'; // Provide the desired output path

    const success = await this.backgroundRemovalService.myRemoveBgFunction(
      inputImagePath,
      outputImagePath,
      user,
    );

    // return `background remove successfully!!`
    if (success) {
      return { message: 'Background removed successfully', result: success };
    } else {
      return { message: 'Background removal failed' };
    }
  }

  // upload file
  @Post('upload/file')
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
  async fileUpload(
    @UploadedFile() file: Express.Multer.File,
    @UserPayload() user: UserInterface,
  ) {
    return {
      statusCode: 200,
      data: file.path,
    };
  }

  /**
   * for developer api
   */
  @Post('developer')
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
  async removeBackgroundForDeveloper(
    @Body('apiKey') apiKey: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const inputImagePath = file.path;
    const outputImagePath = Date.now() + '.jpg'; // Provide the output path

    const data = await this.backgroundRemovalService.removeBgByApiKey(
      inputImagePath,
      outputImagePath,
      apiKey,
    );
    return { message: 'successful', result: data };
  }
}
