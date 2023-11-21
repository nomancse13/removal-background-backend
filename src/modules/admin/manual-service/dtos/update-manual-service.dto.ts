import { PartialType } from '@nestjs/swagger';
import { CreateManualServiceDto } from './create-manual-service.dto';

export class UpdateManualServiceDto extends PartialType(
  CreateManualServiceDto,
) {}
