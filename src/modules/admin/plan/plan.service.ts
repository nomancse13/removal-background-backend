import { InjectRepository } from '@nestjs/typeorm';
import { Brackets } from 'typeorm';
import { BaseRepository } from 'typeorm-transactional-cls-hooked';
import { CreatePlanDto, UpdatePlanDto } from './dtos';
import { PlanEntity } from './entity';
import {
  Pagination,
  PaginationOptionsInterface,
  UserInterface,
} from 'src/authentication/common/interfaces';
import {
  PaginationDataDto,
  SoftDeleteDto,
} from 'src/authentication/common/dtos';
import {
  ErrorMessage,
  StatusField,
  UserTypesEnum,
} from 'src/authentication/common/enum';
import { decrypt } from 'src/helper/crypto.helper';
import { BadRequestException } from '@nestjs/common';
import { OrderEntity } from 'src/modules/user/order/entity/order.entity';
import slugGenerator from 'src/helper/slugify.helper';
import * as randToken from 'rand-token';

export class PlanService {
  constructor(
    @InjectRepository(PlanEntity)
    private planRepository: BaseRepository<PlanEntity>,
  ) {}

  //   create plan
  async createPlan(createPlanDto: CreatePlanDto, userPayload: UserInterface) {
    createPlanDto['createdBy'] = userPayload.id;

    let slug = slugGenerator(createPlanDto.name);
    const check = await this.planRepository.findOne({
      where: {
        slug: slug,
      },
    });

    if (check) {
      slug =
        slug +
        '-' +
        randToken.generate(4, 'abcdefghijklnmopqrstuvwxyz0123456789');
    }
    createPlanDto['slug'] = slug;

    const data = await this.planRepository.save(createPlanDto);
    return data;
  }

  // update plan by id

  async updatePlan(
    id: number,
    userPayload: UserInterface,
    updatePlanDto: UpdatePlanDto,
  ) {
    updatePlanDto['updatedBy'] = userPayload.id;

    const updatedData = await this.planRepository
      .createQueryBuilder()
      .update(PlanEntity, updatePlanDto)
      .where(`id = ${id}`)
      .execute();

    return updatedData.affected == 1
      ? 'updated successfully!'
      : 'updated failed!';
  }

  // get single plan

  async getSinglePlan(id: number, userPayload: UserInterface) {
    const data = await this.planRepository.findOne({
      where: { id: id, createdBy: userPayload.id },
    });
    return data;
  }

  // get single plan

  async getSinglePlanForAll(id: number) {
    const data = await this.planRepository.findOne({
      where: { id: id },
    });

    if (data) {
      return data;
    } else {
      throw new BadRequestException(`Data not Found!`);
    }
  }

  // paginated data plan
  async paginatedPlan(
    listQueryParam: PaginationOptionsInterface,
    filter: any,
    userPayload: UserInterface,
  ) {
    if (decrypt(userPayload.hashType) !== UserTypesEnum.ADMIN) {
      throw new BadRequestException(
        'You are not allow to see any kind of plan',
      );
    }
    const limit: number = listQueryParam.limit ? listQueryParam.limit : 10;
    const page: number = listQueryParam.page
      ? +listQueryParam.page == 1
        ? 0
        : listQueryParam.page
      : 1;

    const [results, total] = await this.planRepository
      .createQueryBuilder('plan')
      .where(
        new Brackets((qb) => {
          if (filter) {
            qb.where(`plan.name ILIKE ('%${filter}%')`);
          }
        }),
      )
      .andWhere(`plan.status = '${StatusField.ACTIVE}'`)
      .orderBy('plan.id', 'DESC')
      .take(limit)
      .skip(page > 0 ? page * limit - limit : page)
      .getManyAndCount();

    return new Pagination<PlanEntity>({
      results,
      total,
      currentPage: page === 0 ? 1 : page,
      limit,
    });
  }

  // delete plan by id
  async deletePlan(id: number, userPayload: UserInterface) {
    const data = await this.planRepository.delete({
      id: id,
      createdBy: userPayload.id,
    });

    if (data.affected == 0) {
      throw new BadRequestException(`Failed to Delete!!`);
    }

    return `Delete Successfully!!`;
  }

  // soft delete plan

  async softDeletePlan(
    softDeleteDto: SoftDeleteDto,
    userPayload: UserInterface,
  ) {
    const updatedData = {
      deletedAt: new Date(),
      deletedBy: userPayload.id,
      status: StatusField.DELETED,
    };

    const data = await this.planRepository
      .createQueryBuilder()
      .update(PlanEntity, updatedData)
      .where('id IN (:...ids)', {
        ids: softDeleteDto.ids,
      })
      .execute();

    return data.affected
      ? 'soft deleted successfully!'
      : ErrorMessage.DELETE_FAILED;
  }

  // paginated data plan
  async paginatedPlanForUser(
    listQueryParam: PaginationOptionsInterface,
    filter: any,
    userPayload: UserInterface,
  ) {
    if (
      decrypt(userPayload.hashType) !== UserTypesEnum.USER ||
      decrypt(userPayload.hashType) !== UserTypesEnum.CLIENT
    ) {
      throw new BadRequestException(
        'You are not allow to see any kind of plan',
      );
    }
    const limit: number = listQueryParam.limit ? listQueryParam.limit : 10;
    const page: number = listQueryParam.page
      ? +listQueryParam.page == 1
        ? 0
        : listQueryParam.page
      : 1;

    const [results, total] = await this.planRepository
      .createQueryBuilder('plan')
      .leftJoinAndMapOne(
        'plan.order',
        OrderEntity,
        'order',
        `plan.id = order.planId AND order.userId = ${userPayload.id}`,
      )
      .where(
        new Brackets((qb) => {
          if (filter) {
            qb.where(`plan.name ILIKE ('%${filter}%')`);
          }
        }),
      )
      .andWhere(`plan.status = '${StatusField.ACTIVE}'`)
      .select([
        `plan.status`,
        `plan.id`,
        `plan.name`,
        `plan.slug`,
        `plan.description`,
        `plan.isActive`,
        `plan.price`,
        `plan.quantity`,
        `plan.duration`,
        `order.userId`,
        `order.planId`,
        `order.subscriptionStatus`,
      ])
      .orderBy('plan.id', 'DESC')
      .take(limit)
      .skip(page > 0 ? page * limit - limit : page)
      .getManyAndCount();

    return new Pagination<PlanEntity>({
      results,
      total,
      currentPage: page === 0 ? 1 : page,
      limit,
    });
  }
}
