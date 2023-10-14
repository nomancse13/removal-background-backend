import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  PaginationOptionsInterface,
  UserInterface,
} from 'src/authentication/common/interfaces';
import { PlanService } from 'src/modules/admin/plan/plan.service';

@ApiTags('Public|Plan')
@Controller({
  path: 'plan',
  version: '1',
})
export class PublicPlanController {
  constructor(private readonly planService: PlanService) {}

  // get all plan data with paginaiton
  @ApiOperation({
    summary: 'get all plan data with pagination',
    description:
      'this route is responsible for getting all plan data with pagination',
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
    const result = await this.planService.paginatedPlanForPublic(
      listQueryParam,
      filter,
    );

    return { message: 'successful', result: result };
  }
}
