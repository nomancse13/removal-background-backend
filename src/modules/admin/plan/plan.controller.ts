import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { PlanService } from './plan.service';
import { CreatePlanDto, UpdatePlanDto } from './dtos';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PaginationOptionsInterface, UserInterface } from 'src/authentication/common/interfaces';
import { UserPayload } from 'src/authentication/utils/decorators';
import { PaginationDataDto } from 'src/authentication/common/dtos';
import { AdminGuard } from 'src/authentication/auth/guards';

@ApiTags('Admin|Plan')
@ApiBearerAuth('jwt')
@UseGuards(AdminGuard)
@Controller({
  path: 'plan',
  version: '1',
})
export class PlanController {
    constructor(private readonly planService: PlanService) {}
  //   // soft delete plan
  //   @ApiOperation({
  //     summary: 'soft delete plan',
  //     description: 'this route is responsible for soft delete plan',
  //   })
  //   @ApiBody({
  //     type: SoftDeleteDto,
  //     description:
  //       'How to delete one or more plan softly?...here is the example given below!',
  //     examples: {
  //       a: {
  //         summary: 'default',
  //         value: {
  //           ids: [2],
  //         } as unknown as SoftDeleteDto,
  //       },
  //     },
  //   })
  //   @Patch('soft-delete')
  //   async softDelete(
  //     @Body() softDeleteDto: SoftDeleteDto,
  //     @UserPayload() userPayload: UserInterface,
  //   ) {
  //     const data = await this.planService.softDeletePlan(
  //       softDeleteDto,
  //       userPayload,
  //     );
  //     return {
  //       message: 'successful!',
  //       result: data,
  //     };
  //   }
    //   create plan route
    @ApiOperation({
      summary: 'plan creation',
      description: 'this route is responsible for create a plan',
    })
    @ApiBody({
      type: CreatePlanDto,
      description:
        'How to create a plan with body?... here is the example given below:',
      examples: {
        a: {
          summary: 'default',
          value: {
            name: 'test plan',
            slug: 'test-plan',
            description: 'Loem Ipsum...',
            isActive: 1,
            price: 23,
            currency: 'AFD',
            periodInterval: 5,
            timePeriod: '2022-04-05 09:58:47',
            timeInterval: 'days',
            features: [
              {
                name: 'test',
                description: 'Loem Ipsum...',
                value: 123,
              },
              {
                name: 'test2',
                description: 'Loem Ipsum...',
                value: 1234,
              },
            ],
          } as unknown as CreatePlanDto,
        },
      },
    })
    @Post()
    async createPlan(
      @Body() createPlanDto: CreatePlanDto,
      @UserPayload() userPayload: UserInterface,
    ) {
      const data = await this.planService.createPlan(createPlanDto, userPayload);
      return { message: 'Successful', result: data };
    }


    // update a plan by id
    @ApiOperation({
      summary: 'update plan by id',
      description: 'this route is responsible for update a plan by id',
    })
    @ApiBody({
      type: UpdatePlanDto,
      description:
        'How to update a plan by id?... here is the example given below!',
      examples: {
        a: {
          summary: 'default',
          value: {
            name: 'test plan',
            slug: 'test-plan',
            description: 'Loem Ipsum...',
            isActive: 1,
            price: 23,
            currency: 'AFD',
            periodInterval: 5,
            timePeriod: '2022-04-05 09:58:47',
            timeInterval: 'days',
            features: [
              {
                name: 'test',
                description: 'Loem Ipsum...',
                value: 123,
              },
              {
                name: 'test2',
                description: 'Loem Ipsum...',
                value: 1234,
              },
            ],
          },
        },
      },
    })
    @ApiParam({
      name: 'id',
      type: Number,
      description: 'for update a plan required id',
      required: true,
    })
    @Patch(':id')
    async update(
      @Param('id') id: number,
      @UserPayload() userPayload: UserInterface,
      @Body() updatePlanDto: UpdatePlanDto,
    ) {
      const data = await this.planService.updatePlan(
        id,
        userPayload,
        updatePlanDto,
      );
      return { message: 'successful!', result: data };
    }
    // get single plan by id
    @ApiOperation({
      summary: 'get single plan by id',
      description: 'this route is responsible for getting single plan by id',
    })
    @ApiParam({
      name: 'id',
      type: Number,
      description: 'For getting single plan required id',
      required: true,
    })
    @Get(':id')
    async singleGet(
      @Param('id') id: number,
      @UserPayload() userPayload: UserInterface,
    ) {
      const data = await this.planService.getSinglePlan(id, userPayload);
      return { message: 'successful!', result: data };
    }


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
  @Get('get/all')
  @UseGuards(AdminGuard)
  async planData(
    @Query() listQueryParam: PaginationOptionsInterface,
    @Query('filter') filter: any,
    @UserPayload() userPayload: UserInterface,
  ) {
    const result = await this.planService.paginatedPlan(
      listQueryParam,
      filter,
      userPayload
    );

    return { message: 'successful', result: result };
  }
    // delete single plan
    @ApiOperation({
      summary: 'delete single plan by id',
      description: 'this route is responsible for delete a single plan by id',
    })
    @ApiParam({
      name: 'id',
      type: Number,
      description: 'delete single plan required id',
      required: true,
    })
    @Delete(':id')
    async deletePlan(
      @Param('id') id: number,
      @UserPayload() userPayload: UserInterface,
    ) {
      const data = await this.planService.deletePlan(id, userPayload);
      return { message: 'successful!', result: data };
    }
}
