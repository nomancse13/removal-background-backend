import { PartialType } from '@nestjs/swagger';
import { CreateApiPlanDto } from './create-api-plan.dto';

export class UpdateApiPlanDto extends PartialType(CreateApiPlanDto) {}
