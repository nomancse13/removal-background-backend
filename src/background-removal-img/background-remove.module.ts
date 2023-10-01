/**controllers */
/**services */

import { Module } from "@nestjs/common";
import { BackgroundRemovalService } from "./background-remove.service";
import { BackgroundRemovalController } from "./background-remove.controller";
import { UserModule } from "src/modules/user/user.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BackgroundRemoveEntity } from "./entity";
import { AdminModule } from "src/modules/admin/admin.module";

/**Authentication strategies */
@Module({
  imports: [
    TypeOrmModule.forFeature([
        BackgroundRemoveEntity,
      ]),
      UserModule,
      AdminModule
  ],
  controllers: [
    BackgroundRemovalController,
  ],
  providers: [
    BackgroundRemovalService
  ],
  exports: [
    BackgroundRemovalService
  ],
})
export class BackgroundRemovalModule {}
