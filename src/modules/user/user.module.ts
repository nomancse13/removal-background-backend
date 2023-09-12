/**dependencies */
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueueMailModule } from '../queue-mail/queue-mail.module';
import { AuthModule } from 'src/authentication/auth/auth.module';
import { UserEntity } from './entities';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AdminModule } from '../admin/admin.module';
import { OrderController } from './order/order.controller';
import { OrderService } from './order/order.service';
import { OrderEntity } from './order/entity/order.entity';
import { BackgroundRemovalService } from '../../background-removal-img/background-remove.service';
import { OrderHistoryEntity } from './order/entity/order-history.entity';
/**controllers */
/**services */
/**Authentication strategies */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      OrderEntity,
      OrderHistoryEntity,
    ]),
    QueueMailModule,
    AdminModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [
    UserController,
    OrderController,
  ],
  providers: [
    UserService,
    OrderService,
  ],
  exports: [
    UserService,
    OrderService,
  ],
})
export class UserModule {}
