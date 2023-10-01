import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CreatePriceFixingDto, UpdatePriceFixingDto } from './dtos';
import { PriceFixingService } from './price-fixing.service';
import { AdminGuard } from 'src/authentication/auth/guards';
import { PaginationOptionsInterface, UserInterface } from 'src/authentication/common/interfaces';
import { UserPayload } from 'src/authentication/utils/decorators';

@ApiTags('Admin|Price Fix')
@ApiBearerAuth('jwt')
@UseGuards(AdminGuard)
@Controller({
  path: 'price-fixing',
  version: '1',
})
export class PriceFixingController {
  constructor(private readonly priceFixingService: PriceFixingService) {}

  // get all price fixing data

  @ApiOperation({
    summary: 'get price fixing data',
    description: 'this route is responsible for get price fixing data',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    description: 'insert limit if you need',
    required: false,
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    description: 'insert page if you need',
    required: false,
  })
  @ApiQuery({
    name: 'filter',
    type: String,
    description: 'insert filter if you need',
    required: false,
  })
  @Get()
  async priceFixingData(
    @Query() listQueryParam: PaginationOptionsInterface,
    @Query('filter') filter: any,
  ) {
    const result = await this.priceFixingService.paginatedPriceFixing(
      listQueryParam,
      filter,
    );

    return { message: 'successful', result: result };
  }

  //   add price

  @ApiOperation({
    summary: 'price add',
    description:
      'this route is responsible for adding price for multiple module',
  })
  @ApiBody({
    type: CreatePriceFixingDto,
    description:
      'How to add price with body?... here is the example given below:',
    examples: {
      a: {
        summary: 'default',
        value: {
          quantity: 1,
          price: 2341,
        } as unknown as CreatePriceFixingDto,
      },
    },
  })
  @Post()
  async createPriceFix(
    @Body() createPriceFixingDto: CreatePriceFixingDto,
    @UserPayload() userPayload: UserInterface,
  ) {
    const data = await this.priceFixingService.createPriceFix(
      createPriceFixingDto,
      userPayload,
    );

    return { message: 'Successful', result: data };
  }

  // update a price-fixing by id
  @ApiOperation({
    summary: 'update price fixing by id',
    description: 'this route is responsible for update a price fixing by id',
  })
  @ApiBody({
    type: UpdatePriceFixingDto,
    description:
      'How to update a price fixing by id?... here is the example given below!',
    examples: {
      a: {
        summary: 'default',
        value: {
          quantity: 1,
          price: 2341,
        },
      },
    },
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'for update a price fixing required id',
    required: true,
  })
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @UserPayload() userPayload: UserInterface,
    @Body() updatePriceFixingDto: UpdatePriceFixingDto,
  ) {
    const data = await this.priceFixingService.updatePrice(
      id,
      userPayload,
      updatePriceFixingDto,
    );
    return { message: 'successful!', result: data };
  }

  // get single price fixing by id

  @ApiOperation({
    summary: 'get single price fixing by id',
    description:
      'this route is responsible for getting single price fixing by id',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'For getting single price fixing required id',
    required: true,
  })
  @Get(':id')
  async singleGet(
    @Param('id') id: number,
    @UserPayload() userPayload: UserInterface,
  ) {
    const data = await this.priceFixingService.getSinglePrice(id, userPayload);
    return { message: 'successful!', result: data };
  }

  // delete single price fixing
  @ApiOperation({
    summary: 'delete single PriceFixingModule by id',
    description:
      'this route is responsible for delete a single PriceFixingModule by id',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'delete single PriceFixingModule required id',
    required: true,
  })
  @Delete(':id')
  async deletePriceFix(
    @Param('id') id: number,
    @UserPayload() userPayload: UserInterface,
  ) {
    const data = await this.priceFixingService.deletePriceFixing(
      id,
      userPayload,
    );
    return { message: 'successful!', result: data };
  }
}
