import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ErrorMessage } from 'src/authentication/common/enum';
import { PaginationOptionsInterface } from 'src/authentication/common/interfaces';
import { ManualServiceOrderDto } from './dto/manual-service-order.dto';
import { PlanService } from 'src/modules/admin/plan/plan.service';

@ApiTags('Public|Manual Service')
@Controller({
  path: 'manual/service',
  version: '1',
})
export class PublicManualServiceController {
  constructor(private readonly planService: PlanService) {}

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
  @Get()
  async planData(
    @Query() listQueryParam: PaginationOptionsInterface,
    @Query('filter') filter: any,
  ) {
    const result = await this.planService.paginatedManualServiceForPublic(
      listQueryParam,
      filter,
    );

    return { message: 'successful', result: result };
  }

  //create a new order for manual service
  @ApiOperation({
    summary: 'create a new order for manual service',
    description:
      'this route is responsible for create a new order for manual service',
  })
  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files'))
  async create(
    @Body() manualServiceOrderDto: ManualServiceOrderDto,
    @UploadedFiles() files: any,
  ) {
    if (files.length === 0) {
      throw new NotFoundException(`File ${ErrorMessage.INFO_NOT_FOUND}`);
    }
    manualServiceOrderDto['files'] = files;
    const data = await this.planService.createManualDoc(manualServiceOrderDto);
    return { message: 'success', result: data };
  }
}
