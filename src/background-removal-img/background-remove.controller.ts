// src/background-removal/background-removal.controller.ts
import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
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
    console.log(success, 'succes');

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
    console.log(file, 'fileq');

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
}
// background-removal.controller.ts

// import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
// import { FileInterceptor } from '@nestjs/platform-express/multer';
// import { Express } from 'express';
// import * as sharp from 'sharp';
// import * as tf from '@tensorflow/tfjs-node';
// import * as deeplab from '@tensorflow-models/deeplab';

// @Controller('background-removal')
// export class BackgroundRemovalController {
//   private model: deeplab.SemanticSegmentation;

//   constructor() {
//     this.initializeModel();
//   }

//   private async initializeModel() {
//     // Load the DeepLabV3 model
//     this.model = await deeplab.load();
//   }

//   @Post('remove')
//   @UseInterceptors(FileInterceptor('image'))
//   async removeBackground(@UploadedFile() image: Express.Multer.File) {
//     // Read and process the uploaded image
//     const processedImage = await this.processImage(image.buffer);

//     // Perform background removal
//     const removedBackgroundImage = await this.removeBackgroundFromImage(processedImage);

//     // Return the result
//     return { result: 'success', image: removedBackgroundImage.toString('base64') };
//   }

//   private async processImage(imageBuffer: Buffer): Promise<Buffer> {
//     return sharp(imageBuffer)
//       .resize(800) // Resize if needed
//       .toBuffer();
//   }

//   private async removeBackgroundFromImage(imageBuffer: Buffer): Promise<Buffer> {
//     // Convert the image to a tensor
//     const inputTensor = tf.node.decodeImage(imageBuffer);

//     // Perform semantic segmentation
//     const segmentationResult = await this.model.segment(inputTensor);

//     // Create a mask where the person is present (foreground)
//     const foregroundMask = segmentationResult.segmentationMap;

//     // Apply the mask to the original image
//     const imageTensor = tf.node.decodeImage(imageBuffer);
//     const maskedImage = tf.mul(imageTensor, tf.cast(foregroundMask, 'float32'));

//     // Convert the masked image back to a buffer
//     const outputBuffer = await tf.node.encodeJpeg(maskedImage);

//     return outputBuffer;
//   }
// }
