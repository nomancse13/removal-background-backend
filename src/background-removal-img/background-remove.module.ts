/**controllers */
/**services */

import { Module } from "@nestjs/common";
import { BackgroundRemovalService } from "./background-remove.service";
import { BackgroundRemovalController } from "./background-remove.controller";
import { UserModule } from "src/modules/user/user.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BackgroundRemoveEntity } from "./entity";

/**Authentication strategies */
@Module({
  imports: [
    TypeOrmModule.forFeature([
        BackgroundRemoveEntity,
      ]),
      UserModule
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
