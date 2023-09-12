import { Injectable, Res } from '@nestjs/common';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class AppService {
  async getHello(@Res() res: Response) {
    try {
      const filePath = path.join(__dirname, 'index.html');

      if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
      } else {
        res.status(404).send('File not found.');
      }
    } catch (error) {
      console.error('Error sending file:', error);
      res.status(500).send('Internal Server Error');
    }
  }
}
