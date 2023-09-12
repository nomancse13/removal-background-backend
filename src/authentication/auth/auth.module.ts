/**dependencies */
import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
/**controllers */
import { AuthController } from './auth.controller';
/**services */
import { AuthService } from './auth.service';
/**Authentication strategies */
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from 'src/modules/admin/admin.module';
import { QueueMailModule } from 'src/modules/queue-mail/queue-mail.module';
import { UserEntity } from 'src/modules/user/entities';
import { UserModule } from 'src/modules/user/user.module';
import { AtStrategy, RtStrategy } from './strategy';
import { SystemUserEntity } from 'src/modules/admin/entities';
// import { AtStrategy, RtStrategy } from './strategy';

@Module({
  imports: [
    forwardRef(() => UserModule),
    ConfigModule,
    PassportModule,
    TypeOrmModule.forFeature([UserEntity, SystemUserEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        // secret: configService.get<string>('AT_SECRET'),
        // secretOrPrivateKey: 'thisisdarknightisontequaltoday.weareawesome',
        // signOptions: {
        //   expiresIn: 3600,
        // },
      }),
      inject: [ConfigService],
    }),
    QueueMailModule,
AdminModule,  ],
  controllers: [AuthController],
  providers: [AuthService, RtStrategy, AtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
