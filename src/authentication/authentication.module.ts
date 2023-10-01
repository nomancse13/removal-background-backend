import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AppLoggerModule } from './logger/app-logger.module';
import { CommentController } from './comment/comment.controller';
import { CommentService } from './comment/comment.service';
import { CommentEntity } from './comment/entities';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  controllers: [CommentController],
  providers: [CommentService],
  imports: [ TypeOrmModule.forFeature([
    CommentEntity
  ]),
  AuthModule, AppLoggerModule],
  exports: [CommentService],
})
export class AuthenticationModule {}
