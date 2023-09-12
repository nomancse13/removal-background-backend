import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Injectable, Res } from '@nestjs/common';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getHello(@Res() res: Response) {
    try {
      const filePath = path.join(`d:/removal-background`, 'index.html');

      console.log(filePath, 'fff');
      
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
