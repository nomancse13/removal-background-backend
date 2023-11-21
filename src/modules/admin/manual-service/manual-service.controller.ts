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
import { CreateManualServiceDto, UpdateManualServiceDto } from './dtos';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  PaginationOptionsInterface,
  UserInterface,
} from 'src/authentication/common/interfaces';
import { UserPayload } from 'src/authentication/utils/decorators';
import { AdminGuard } from 'src/authentication/auth/guards';
import { ManualService } from './manual-service.service';

@ApiTags('Admin|Manual Service')
@ApiBearerAuth('jwt')
@UseGuards(AdminGuard)
@Controller({
  path: 'manual/service',
  version: '1',
})
export class ManualServiceController {
  constructor(private readonly manualService: ManualService) {}

  //   create manual service
  @ApiOperation({
    summary: 'manual service creation',
    description: 'this route is responsible for create a manual service',
  })
  @ApiBody({
    type: CreateManualServiceDto,
    description:
      'How to create a manual service with body?... here is the example given below:',
    examples: {
      a: {
        summary: 'default',
        value: {
          name: 'test plan',
          price: 23,
          quantity: 1,
        } as unknown as CreateManualServiceDto,
      },
    },
  })
  @Post()
  async createManualService(
    @Body() createManualServiceDto: CreateManualServiceDto,
    @UserPayload() userPayload: UserInterface,
  ) {
    const data = await this.manualService.createManualService(
      createManualServiceDto,
      userPayload,
    );
    return { message: 'Successful', result: data };
  }

  // update a manual service by id
  @ApiOperation({
    summary: 'update manual service by id',
    description: 'this route is responsible for update a manual service by id',
  })
  @ApiBody({
    type: UpdateManualServiceDto,
    description:
      'How to update a manual service by id?... here is the example given below!',
    examples: {
      a: {
        summary: 'default',
        value: {
          name: 'test plan',
          price: 23,
          quantity: 1,
        },
      },
    },
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'for update a manual service required id',
    required: true,
  })
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @UserPayload() userPayload: UserInterface,
    @Body() updateManualServiceDto: UpdateManualServiceDto,
  ) {
    const data = await this.manualService.updateManualService(
      id,
      userPayload,
      updateManualServiceDto,
    );
    return { message: 'successful!', result: data };
  }
  // get single manual service by id
  @ApiOperation({
    summary: 'get single manual service by id',
    description:
      'this route is responsible for getting single manual service by id',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'For getting single manual service required id',
    required: true,
  })
  @Get(':id')
  async singleGet(
    @Param('id') id: number,
    @UserPayload() userPayload: UserInterface,
  ) {
    const data = await this.manualService.getSingleManualService(
      id,
      userPayload,
    );
    return { message: 'successful!', result: data };
  }

  // get all manual service data with paginaiton
  @ApiOperation({
    summary: 'get all manual service data with pagination',
    description:
      'this route is responsible for getting all manual service data with pagination',
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
  @Get('get/all')
  @UseGuards(AdminGuard)
  async paginatedManualService(
    @Query() listQueryParam: PaginationOptionsInterface,
    @Query('filter') filter: any,
    @UserPayload() userPayload: UserInterface,
  ) {
    const result = await this.manualService.paginatedManualService(
      listQueryParam,
      filter,
      userPayload,
    );

    return { message: 'successful', result: result };
  }
  // delete single manual service
  @ApiOperation({
    summary: 'delete single manual service by id',
    description:
      'this route is responsible for delete a single manual service by id',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'delete single manual service required id',
    required: true,
  })
  @Delete(':id')
  async deleteManual(
    @Param('id') id: number,
    @UserPayload() userPayload: UserInterface,
  ) {
    const data = await this.manualService.deleteManual(id, userPayload);
    return { message: 'successful!', result: data };
  }
}
