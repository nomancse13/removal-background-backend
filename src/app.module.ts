import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BackgroundRemovalModule } from './background-removal-img/background-remove.module';
import { RouterModule } from '@nestjs/core';
import { AuthenticationModule } from './authentication/authentication.module';
import { AdminModule } from './modules/admin/admin.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfigModule, TypeOrmConfigService } from './authentication/auth/config/typeorm-config';
import { ConfigService } from 'aws-sdk';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './modules/user/user.module';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerMiddleware } from './authentication/middleware';
import { validate } from './authentication/auth/config/env.validation';
import { QueueMailConsumer } from './modules/queue-mail/queue-mail.consumer';
import { PublicModule } from './public/public.module';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
     /**initialize nest js config module */
     ConfigModule.forRoot({
      validate: validate,
      //responsible for use config values globally
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),

      // Typeorm initialize
      TypeOrmModule.forRootAsync({
        imports: [TypeOrmConfigModule],
        inject: [ConfigService],
        // Use useFactory, useClass, or useExisting
        // to configure the ConnectionOptions.
        name: TypeOrmConfigService.connectionName,
        useExisting: TypeOrmConfigService,
        // connectionFactory receives the configured ConnectionOptions
        // and returns a Promise<Connection>.
        // dataSourceFactory: async (options) => {
        //   const connection = await createConnection(options);
        //   return connection;
        // },
      }),
     //module prefix for modules
     RouterModule.register([
      //module prefix for admin
      {
        path: 'rembg',
        module: BackgroundRemovalModule,
      },
      {
        path: 'admin',
        module: AdminModule,
      },
      {
        path: 'public',
        module: PublicModule,
      },
      
    ]),
    MulterModule.register({dest: './uploads', storage: './uploads'}),
    BackgroundRemovalModule, AuthenticationModule, AdminModule, UserModule, PublicModule],
  controllers: [AppController],
  providers: [AppService, QueueMailConsumer],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}