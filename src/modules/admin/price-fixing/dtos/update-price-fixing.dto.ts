import { PartialType } from '@nestjs/swagger';
import { CreatePriceFixingDto } from './create-price-fixing.dto';

export class UpdatePriceFixingDto extends PartialType(CreatePriceFixingDto) {}
