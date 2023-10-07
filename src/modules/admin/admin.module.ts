/**dependencies */
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueueMailModule } from '../queue-mail/queue-mail.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuthModule } from 'src/authentication/auth/auth.module';
import { SystemUserEntity } from './entities';
import { ApiPlanEntity, PlanEntity } from './plan/entity';
import { PlanService } from './plan/plan.service';
import { PlanController } from './plan/plan.controller';
import { ActivityLogEntity } from './activity-log/entity';
import { ActivityLogController } from './activity-log/activityLog.controller';
import { ActivityLogService } from './activity-log/activityLog.service';
import { BlogEntity } from './blog/entities';
import { BlogController } from './blog/blog.controller';
import { BlogService } from './blog/blog.service';
import { PriceFixingService } from './price-fixing/price-fixing.service';
import { PriceFixingController } from './price-fixing/price-fixing.controller';
import { PriceFixingEntity } from './price-fixing/entity';
import { OrderEntity } from '../user/order/entity/order.entity';
/**controllers */
/**Authentication strategies */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      SystemUserEntity,
      PlanEntity,
      ActivityLogEntity,
      BlogEntity,
      PriceFixingEntity,
      OrderEntity,
      ApiPlanEntity,
    ]),
    QueueMailModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [
    AdminController,
    PlanController,
    ActivityLogController,
    BlogController,
    PriceFixingController,
  ],
  providers: [
    AdminService,
    PlanService,
    ActivityLogService,
    BlogService,
    PriceFixingService,
  ],
  exports: [
    AdminService,
    PlanService,
    ActivityLogService,
    PriceFixingService,
    BlogService,
  ],
})
export class AdminModule {}
