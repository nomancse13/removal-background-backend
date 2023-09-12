/**dependencies */
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueueMailModule } from '../queue-mail/queue-mail.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuthModule } from 'src/authentication/auth/auth.module';
import { SystemUserEntity } from './entities';
import { PlanEntity } from './plan/entity';
import { PlanService } from './plan/plan.service';
import { PlanController } from './plan/plan.controller';
/**controllers */
/**services */
/**Authentication strategies */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      SystemUserEntity,
      PlanEntity
    ]),
    QueueMailModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [
    AdminController,
    PlanController
  ],
  providers: [
    AdminService,
    PlanService
  ],
  exports: [
    AdminService,
    PlanService
  ],
})
export class AdminModule {}
