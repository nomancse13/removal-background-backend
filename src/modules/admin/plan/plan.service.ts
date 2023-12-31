import { InjectRepository } from '@nestjs/typeorm';
import { Brackets } from 'typeorm';
import { BaseRepository } from 'typeorm-transactional-cls-hooked';
import {
  CreateApiPlanDto,
  CreatePlanDto,
  UpdateApiPlanDto,
  UpdatePlanDto,
} from './dtos';
import { ApiPlanEntity, PlanEntity, PublicManualOrderEntity } from './entity';
import {
  Pagination,
  PaginationOptionsInterface,
  UserInterface,
} from 'src/authentication/common/interfaces';
import { SoftDeleteDto } from 'src/authentication/common/dtos';
import {
  ErrorMessage,
  PackagePeriodEnum,
  StatusField,
  UserTypesEnum,
} from 'src/authentication/common/enum';
import { decrypt } from 'src/helper/crypto.helper';
import { BadRequestException } from '@nestjs/common';
import { OrderEntity } from 'src/modules/user/order/entity/order.entity';
import slugGenerator from 'src/helper/slugify.helper';
import * as randToken from 'rand-token';
import * as path from 'path';
import { QueueMailDto } from 'src/modules/queue-mail/queue-mail.dto';
import { QueueMailService } from 'src/modules/queue-mail/queue-mail.service';
import { ManualServiceOrderDto } from 'src/public/manual-service/dto/manual-service-order.dto';

export class PlanService {
  constructor(
    @InjectRepository(PlanEntity)
    private planRepository: BaseRepository<PlanEntity>,
    @InjectRepository(ApiPlanEntity)
    private apiPlanRepository: BaseRepository<ApiPlanEntity>,
    private readonly queueMailService: QueueMailService,
    @InjectRepository(PublicManualOrderEntity)
    private manualOrderRepository: BaseRepository<PublicManualOrderEntity>,
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
      throw new BadRequestException(`Plan not Found!`);
    }
  }

  // get single plan

  async getFreePlan() {
    const data = await this.planRepository.findOne({
      where: { price: 0 },
    });

    if (data) {
      return data;
    } else {
      throw new BadRequestException(`Plan not Found!`);
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
      decrypt(userPayload.hashType) !== UserTypesEnum.USER &&
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
        `plan.isActive`,
        `plan.price`,
        `plan.quantity`,
        `plan.perImgCost`,
        `plan.packagePeriod`,
        `order.userId`,
        `order.planId`,
        `order.subscriptionStatus`,
      ])
      .orderBy('plan.id', 'DESC')
      .take(limit)
      .skip(page > 0 ? page * limit - limit : page)
      .getManyAndCount();

    const lifetime = [];
    const month = [];

    await Promise.all(
      results.map((e: any) => {
        if (e.packagePeriod === PackagePeriodEnum.LIFE_TIME) {
          lifetime.push({
            id: e.id,
            name: e.name,
            slug: e.slug,
            price: e.price,
            quantity: e.quantity,
            perImgCost: e.perImgCost,
            packagePeriod: e.packagePeriod,
          });
        } else if (e.packagePeriod === PackagePeriodEnum.MONTH) {
          month.push({
            id: e.id,
            name: e.name,
            slug: e.slug,
            price: e.price,
            quantity: e.quantity,
            perImgCost: e.perImgCost,
            packagePeriod: e.packagePeriod,
          });
        }
      }),
    );

    return {
      lifetime,
      month,
    };
  }

  // ******* API PLAN CRUD ************

  //   create api plan
  async createApiPlan(
    createApiPlanDto: CreateApiPlanDto,
    userPayload: UserInterface,
  ) {
    createApiPlanDto['createdBy'] = userPayload.id;

    let slug = slugGenerator(createApiPlanDto.name);
    const check = await this.apiPlanRepository.findOne({
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
    createApiPlanDto['slug'] = slug;

    const data = await this.apiPlanRepository.save(createApiPlanDto);
    return data;
  }

  // update api plan by id

  async updateApiPlan(
    id: number,
    userPayload: UserInterface,
    updateApiPlanDto: UpdateApiPlanDto,
  ) {
    updateApiPlanDto['updatedBy'] = userPayload.id;

    const title = await this.apiPlanRepository.findOne({
      select: ['id', 'name', 'slug'],
      where: {
        id: id,
      },
    });

    if (!title || !title.slug) {
      let slug = slugGenerator(updateApiPlanDto.name);
      const check = await this.apiPlanRepository.findOne({
        select: ['slug'],
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
      updateApiPlanDto['slug'] = slug;
    }
    const updatedData = await this.apiPlanRepository
      .createQueryBuilder()
      .update(ApiPlanEntity, updateApiPlanDto)
      .where(`id = ${id}`)
      .execute();

    return updatedData.affected == 1
      ? 'updated successfully!'
      : 'updated failed!';
  }

  // get single api plan

  async getSingleApiPlan(id: number, userPayload: UserInterface) {
    const data = await this.apiPlanRepository.findOne({
      where: { id: id, createdBy: userPayload.id },
    });
    return data;
  }

  // get single plan

  async getSingleApiPlanForAll(id: number) {
    const data = await this.apiPlanRepository.findOne({
      where: { id: id },
    });

    if (data) {
      return data;
    } else {
      throw new BadRequestException(`Data not Found!`);
    }
  }

  // paginated data api plan
  async paginatedApiPlan(
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

    const [results, total] = await this.apiPlanRepository
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

    return new Pagination<ApiPlanEntity>({
      results,
      total,
      currentPage: page === 0 ? 1 : page,
      limit,
    });
  }

  // delete api plan by id
  async deleteApiPlan(id: number, userPayload: UserInterface) {
    const data = await this.apiPlanRepository.delete({
      id: id,
      createdBy: userPayload.id,
    });

    if (data.affected == 0) {
      throw new BadRequestException(`Failed to Delete!!`);
    }

    return `Delete Successfully!!`;
  }

  // soft delete plan

  async softDeleteApiPlan(
    softDeleteDto: SoftDeleteDto,
    userPayload: UserInterface,
  ) {
    const updatedData = {
      deletedAt: new Date(),
      deletedBy: userPayload.id,
      status: StatusField.DELETED,
    };

    const data = await this.apiPlanRepository
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

  // _____________Public plan Showing_______

  // paginated plan data for showing to public
  async paginatedPlanForPublic(
    listQueryParam: PaginationOptionsInterface,
    filter: any,
  ) {
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
      .select([
        `plan.status`,
        `plan.id`,
        `plan.name`,
        `plan.slug`,
        `plan.isActive`,
        `plan.price`,
        `plan.perImgCost`,
        `plan.packagePeriod`,
        `plan.quantity`,
      ])
      .orderBy('plan.id', 'DESC')
      .take(limit)
      .skip(page > 0 ? page * limit - limit : page)
      .getManyAndCount();

    const lifetime = [];
    const month = [];

    await Promise.all(
      results.map((e: any) => {
        if (e.packagePeriod === PackagePeriodEnum.LIFE_TIME) {
          lifetime.push({
            id: e.id,
            name: e.name,
            slug: e.slug,
            price: e.price,
            quantity: e.quantity,
            perImgCost: e.perImgCost,
            packagePeriod: e.packagePeriod,
          });
        } else if (e.packagePeriod === PackagePeriodEnum.MONTH) {
          month.push({
            id: e.id,
            name: e.name,
            slug: e.slug,
            price: e.price,
            quantity: e.quantity,
            perImgCost: e.perImgCost,
            packagePeriod: e.packagePeriod,
          });
        }
      }),
    );

    return {
      lifetime,
      month,
    };
  }

  // create manual doc

  async createManualDoc(manualServiceOrderDto: ManualServiceOrderDto) {
    const srcData = [];

    for (let i = 0; i < manualServiceOrderDto.files.length; i++) {
      //set upload parameter
      const fileNameData = path.basename(
        manualServiceOrderDto.files[i].originalname,
        path.extname(manualServiceOrderDto.files[i].originalname),
      );

      srcData.push(fileNameData);
    }

    delete manualServiceOrderDto.files;

    manualServiceOrderDto['src'] = srcData;

    // mailing option

    const mailData = new QueueMailDto();

    mailData.toMail = 'noman@gmail.com';
    mailData.subject = `RB: Manual Service Order`;
    mailData.bodyHTML = `A Manual Order is Pending!!!!`;

    //send email
    await this.queueMailService.sendMail(mailData);

    const data = await this.manualOrderRepository.save(manualServiceOrderDto);

    return data;
  }

  // paginated manual service data for showing to public
  async paginatedManualServiceForPublic(
    listQueryParam: PaginationOptionsInterface,
    filter: any,
  ) {
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
      .andWhere(`plan.packagePeriod = '${PackagePeriodEnum.MANUAL}'`)
      .select(['plan.name', 'plan.price', 'plan.quantity'])
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
