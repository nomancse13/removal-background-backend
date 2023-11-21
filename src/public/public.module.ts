import { Module } from '@nestjs/common';
import { PublicBackgroundRemoveController } from './public-background-remove.controller';
import { BackgroundRemovalModule } from 'src/background-removal-img/background-remove.module';
import { PublicBlogController } from './blog/public-blog.controller';
import { AdminModule } from 'src/modules/admin/admin.module';
import { PublicCommentController } from './comment/public-comment.controller';
import { AuthenticationModule } from 'src/authentication/authentication.module';
import { PublicPlanController } from './plan/public-plan.controller';
import { PublicManualServiceController } from './manual-service/public-manual-service.controller';

@Module({
  controllers: [
    PublicBackgroundRemoveController,
    PublicBlogController,
    PublicCommentController,
    PublicPlanController,
    PublicManualServiceController,
  ],
  providers: [],
  imports: [BackgroundRemovalModule, AdminModule, AuthenticationModule],
})
export class PublicModule {}
