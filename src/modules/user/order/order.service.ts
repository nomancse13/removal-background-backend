import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  SubscriptionStatusEnum,
  UserTypesEnum,
} from 'src/authentication/common/enum';
import { OrderEntity } from './entity/order.entity';
import { BaseRepository } from 'typeorm-transactional-cls-hooked';
import { CreateOrderDto } from './dtos';
import {
  Pagination,
  PaginationOptionsInterface,
  UserInterface,
} from 'src/authentication/common/interfaces';
import { PlanService } from 'src/modules/admin/plan/plan.service';
import { OrderHistoryEntity } from './entity/order-history.entity';
import { PlanEntity } from 'src/modules/admin/plan/entity';
import { BadRequestException } from '@nestjs/common';
import { decrypt } from 'src/helper/crypto.helper';
import { ApiPlanOrderEntity } from './entity';
import { Brackets } from 'typeorm';
import { UserEntity } from '../entities';

@Injectable()
export class OrderService {
  constructor(
    // private httpService: HttpService,
    private planService: PlanService,
    @InjectRepository(OrderEntity)
    private orderRepository: BaseRepository<OrderEntity>,
    @InjectRepository(OrderHistoryEntity)
    private orderHistoryRepository: BaseRepository<OrderHistoryEntity>,
    @InjectRepository(ApiPlanOrderEntity)
    private apiPlanOrderRepository: BaseRepository<ApiPlanOrderEntity>,
  ) {}

  // create order for user
  async createOrderLink(body: CreateOrderDto, userPayload: UserInterface) {
    const planInfo = await this.planService.getSinglePlanForAll(body.planId);

    // const isOrderExist = await this.orderRepository.findOne({where: {userId: userPayload.id, subscriptionStatus: SubscriptionStatusEnum.COMPLETE}});
    const isOrderExist = await this.orderRepository.findOne({
      where: { userId: userPayload.id, planId: body.planId },
    });

    const orderData = {
      userId: userPayload.id,
      userType: decrypt(userPayload.hashType),
      planId: body.planId,
      expiredDate: null,
      packageDate: null,
      subscriptionStatus:
        planInfo.name.toLowerCase() == 'free'
          ? SubscriptionStatusEnum.COMPLETE
          : SubscriptionStatusEnum.PENDING,
    };
    if (!isOrderExist) {
      await this.orderRepository.save(orderData);
    } else {
      const updatedData = {
        planId: body.planId,
        subscriptionStatus:
          planInfo.name.toLowerCase() == 'free'
            ? SubscriptionStatusEnum.COMPLETE
            : SubscriptionStatusEnum.PENDING,
      };
      await this.orderRepository.update(
        { userId: userPayload.id, planId: body.planId },
        updatedData,
      );
    }
    await this.orderHistoryRepository.save(orderData);

    return `order confirm successfully!!!`;
  }

  //   // paginated data package
  //   async paginatedAvailPlan(
  //     listQueryParam: PaginationOptionsInterface,
  //     userPayload: UserInterface,
  //   ) {
  //     const limit: number = listQueryParam.limit ? listQueryParam.limit : 10;
  //     const page: number = listQueryParam.page
  //       ? +listQueryParam.page == 1
  //         ? 0
  //         : listQueryParam.page
  //       : 1;
  //     const [results, total] = await this.packageRepository
  //       .createQueryBuilder('package')
  //       .where(`package.createdType = '${UserTypesEnum.ADMIN}'`) // Exclude packages with createdType = 'ADMIN'
  //       .andWhere(
  //         `package.id Not In (SELECT "packageId" FROM "packageOrder" where "subscriptionStatus" = 'complete' and "userId"= ${userPayload.id})`,
  //       )
  //       .orderBy('package.id', 'DESC')
  //       .take(limit)
  //       .skip(page > 0 ? page * limit - limit : page)
  //       .getManyAndCount();

  //     return new Pagination<PackageEntity>({
  //       results,
  //       total,
  //       currentPage: page === 0 ? 1 : page,
  //       limit,
  //     });
  //   }
  //   // paginated my subscription plan
  //   async paginatedMyPlan(
  //     listQueryParam: PaginationOptionsInterface,
  //     userPayload: UserInterface,
  //   ) {
  //     const limit: number = listQueryParam.limit ? listQueryParam.limit : 10;
  //     const page: number = listQueryParam.page
  //       ? +listQueryParam.page == 1
  //         ? 0
  //         : listQueryParam.page
  //       : 1;
  //     const [results, total] = await this.orderRepository
  //       .createQueryBuilder('order')
  //       .leftJoinAndMapOne(
  //         'order.package',
  //         PackageEntity,
  //         'package',
  //         `order.packageId = package.id`,
  //       )
  //       .where(`order.subscriptionStatus = '${SubscriptionStatusEnum.COMPLETE}'`)
  //       .andWhere(`order.userId = ${userPayload.id}`)
  //       .orderBy('package.id', 'DESC')
  //       .take(limit)
  //       .skip(page > 0 ? page * limit - limit : page)
  //       .getManyAndCount();

  //     return new Pagination<OrderEntity>({
  //       results,
  //       total,
  //       currentPage: page === 0 ? 1 : page,
  //       limit,
  //     });
  //   }

  //   // get package by id

  //   async getPackageById(id: number) {
  //     const data = await this.packageRepository.findOne({
  //       where: { id: id },
  //     });
  //     return data;
  //   }

  //   get order by userID

  async getOrderByUserId(userId: number) {
    const data = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndMapOne(
        'order.plan',
        PlanEntity,
        'plan',
        `order.planId = plan.id`,
      )
      .where(`order.userId = ${userId}`)
      .andWhere(
        `order.subscriptionStatus = '${SubscriptionStatusEnum.COMPLETE}'`,
      )
      .getOne();

    if (data) {
      return data;
    } else {
      throw new BadRequestException(`Data not Found!`);
    }
  }
  //   async getOrdersByUserId(userId: number) {
  //     const data = await this.orderRepository.find({
  //       where: {
  //         userId: userId,
  //         subscriptionStatus: SubscriptionStatusEnum.COMPLETE,
  //       },
  //     });

  //     return data;
  //   }

  //   //   async getCheckoutLink(planId: number): Promise<string> {
  //   //     const endpoint =
  //   //       'https://sandbox-vendors.paddle.com/api/2.0/product/generate_pay_link';

  //   //     try {
  //   //       const response = await axios.post(endpoint, {
  //   //         vendor_id: '12329',
  //   //         vendor_auth_code: '23ffc301e81bdf5ac1d7f9b95ac78f952753a26ed0e841ce72',
  //   //         product_id: planId,
  //   //       });

  //   //       const checkoutLink = response.data.response.url;
  //   //       return checkoutLink;
  //   //     } catch (error) {
  //   //       throw new Error('Failed to retrieve checkout link from Paddle.');
  //   //     }
  //   //   }

  //   // update order info

  //   async updateOrderInfo(body: any, userPayload: UserInterface) {
  //     const data = await this.orderRepository.update(
  //       { userId: userPayload.id },
  //       body,
  //     );

  //     return data.affected > 0 ? `updated success!` : 'not updated!';
  //   }
  //   // update order info by id

  //   async updateOrderInfoById(
  //     body: any,
  //     userPayload: UserInterface,
  //     orderId: number,
  //   ) {
  //     const data = await this.orderRepository.update(
  //       { userId: userPayload.id, id: orderId },
  //       body,
  //     );

  //     return data.affected > 0 ? `updated success!` : 'not updated!';
  //   }

  //   // order list which is completed
  //   async paginatedOrderList(
  //     listQueryParam: PaginationOptionsInterface,
  //     userPayload: UserInterface,
  //     filter: any,
  //   ) {
  //     if (decrypt(userPayload.hashType) !== UserTypesEnum.ADMIN) {
  //       throw new BadRequestException(
  //         `You are not allow see the total order list`,
  //       );
  //     }
  //     const limit: number = listQueryParam.limit ? listQueryParam.limit : 10;
  //     const page: number = listQueryParam.page
  //       ? +listQueryParam.page == 1
  //         ? 0
  //         : listQueryParam.page
  //       : 1;
  //     const [results, total] = await this.orderRepository
  //       .createQueryBuilder('order')
  //       .leftJoinAndMapOne(
  //         'order.package',
  //         PackageEntity,
  //         'package',
  //         `order.packageId = package.id`,
  //       )
  //       // .where(
  //       //   new Brackets((qb) => {
  //       //     if (filter) {
  //       //       qb.andWhere(`team.name ILIKE ('%${filter}%')`);
  //       //     }
  //       //   }),
  //       // )
  //       .where(`order.subscriptionStatus = '${SubscriptionStatusEnum.COMPLETE}'`)
  //       .orderBy('order.id', 'DESC')
  //       .take(limit)
  //       .skip(page > 0 ? page * limit - limit : page)
  //       .getManyAndCount();

  //     const result = await Promise.all(
  //       results.map(async (e: any) => {
  //         const expiringTime = e?.package.recurringInterval;
  //         const packageOrderTime = e?.packageDate;
  //         const dayFind = expiringTime.split(' ')[0];
  //         const monthFind = expiringTime.split(' ')[1];

  //         let remainingFinalTime: any;

  //         if (monthFind == 'month' || monthFind == 'Month') {
  //           const time = new Date(packageOrderTime).getTime();
  //           const timeCount = 30 * 24 * 60 * 60 * 1000;
  //           const mainTime = time + timeCount;
  //           const remainTime: any = new Date(mainTime);

  //           const expectedDay = await this.timeRemainingToTargetDate(remainTime);

  //           remainingFinalTime = Math.floor(expectedDay);
  //         } else if (monthFind == 'year' || monthFind == 'Year') {
  //           const time = new Date(packageOrderTime).getTime();
  //           const timeCount = 365 * 24 * 60 * 60 * 1000;
  //           const mainTime = time + timeCount;
  //           const remainTime: any = new Date(mainTime);

  //           const expectedDay = await this.timeRemainingToTargetDate(remainTime);

  //           remainingFinalTime = Math.floor(expectedDay);
  //         } else {
  //           const time = new Date(packageOrderTime).getTime();
  //           const timeCount = Number(dayFind) * 24 * 60 * 60 * 1000;
  //           const mainTime = time + timeCount;

  //           const remainTime: any = new Date(mainTime);

  //           const expectedDay = await this.timeRemainingToTargetDate(remainTime);

  //           remainingFinalTime = Math.floor(expectedDay);
  //         }

  //         return {
  //           timeRemaining: `${remainingFinalTime} day` ?? `${0} day`,
  //           ...e,
  //         };
  //       }),
  //     );

  //     return new Pagination<OrderEntity>({
  //       results: result,
  //       total,
  //       currentPage: page === 0 ? 1 : page,
  //       limit,
  //     });
  //   }

  //   // order list
  //   async orderList(
  //     listQueryParam: PaginationOptionsInterface,
  //     userPayload: UserInterface,
  //     filter: any,
  //   ) {
  //     console.log(filter, 'ffile');

  //     if (decrypt(userPayload.hashType) !== UserTypesEnum.ADMIN) {
  //       throw new BadRequestException(
  //         `You are not allow see the total order list`,
  //       );
  //     }
  //     const limit: number = listQueryParam.limit ? listQueryParam.limit : 10;
  //     const page: number = listQueryParam.page
  //       ? +listQueryParam.page == 1
  //         ? 0
  //         : listQueryParam.page
  //       : 1;
  //     const [results, total] = await this.orderRepository
  //       .createQueryBuilder('order')
  //       .leftJoinAndMapOne(
  //         'order.package',
  //         PackageEntity,
  //         'package',
  //         `order.packageId = package.id`,
  //       )
  //       .leftJoinAndMapOne(
  //         'order.user',
  //         SubscriberUserEntity,
  //         'user',
  //         `order.userId = user.id`,
  //       )
  //       .where(`order.subscriptionStatus = '${SubscriptionStatusEnum.COMPLETE}'`)
  //       .andWhere(
  //         new Brackets((qb) => {
  //           if (filter && filter.startDate && filter.endDate) {
  //             qb.andWhere(
  //               `Date(order.expiredDate) BETWEEN ('${filter.startDate}') AND ('${filter.endDate}')`,
  //             );
  //           } else if (filter && filter.date) {
  //             qb.andWhere(`Date(order.expiredDate) = ('${filter.date}')`);
  //           }
  //         }),
  //       )
  //       .orderBy('order.id', 'DESC')
  //       .take(limit)
  //       .skip(page > 0 ? page * limit - limit : page)
  //       .getManyAndCount();

  //     return new Pagination<OrderEntity>({
  //       results,
  //       total,
  //       currentPage: page === 0 ? 1 : page,
  //       limit,
  //     });
  //   }

  //   async timeRemainingToTargetDate(targetDate) {
  //     const currentDate: any = new Date();
  //     const targetDateTime: any = new Date(targetDate);

  //     const timeDifference = targetDateTime - currentDate;
  //     const remainingDays = timeDifference / (1000 * 60 * 60 * 24);

  //     return remainingDays;
  //   }

  //   @Cron(CronExpression.EVERY_12_HOURS)
  //   async orderStatusCheck() {
  //     const orderData = await this.orderRepository.find({
  //       where: {
  //         status: StatusField.ACTIVE,
  //         subscriptionStatus: SubscriptionStatusEnum.COMPLETE,
  //       },
  //     });

  //     if (orderData && orderData.length > 0) {
  //       await Promise.all(
  //         orderData.map(async (e) => {
  //           const packageInfo = await this.packageService.getPackageById(
  //             e.packageId,
  //           );
  //           const packageTime = new Date(e.packageDate).getTime();
  //           const mainDate = new Date().getTime();

  //           const mainTime = mainDate - packageTime;
  //           let expectedDay: number;

  //           const dayFind = packageInfo.recurringInterval.split(' ')[0];
  //           const monthFind = packageInfo.recurringInterval.split(' ')[1];

  //           if (monthFind == 'month' || monthFind == 'Month') {
  //             expectedDay = 30 * 24 * 60 * 60 * 1000;
  //           } else if (monthFind == 'year' || monthFind == 'Year') {
  //             expectedDay = 12 * 30 * 24 * 60 * 60 * 1000;
  //           } else {
  //             expectedDay = Number(dayFind) * 24 * 60 * 60 * 1000;
  //           }

  //           if (expectedDay < mainTime) {
  //             const updatedData = {
  //               subscriptionStatus: SubscriptionStatusEnum.EXPIRED,
  //             };
  //             await this.orderRepository.update({ id: e.id }, updatedData);
  //           }
  //         }),
  //       );
  //     }
  //   }

  // ******* API PLAN Order api ************

  async createApiPlanOrder(body: CreateOrderDto, userPayload: UserInterface) {
    const planInfo = await this.planService.getSingleApiPlanForAll(body.planId);

    // const isOrderExist = await this.orderRepository.findOne({where: {userId: userPayload.id, subscriptionStatus: SubscriptionStatusEnum.COMPLETE}});
    const isOrderExist = await this.apiPlanOrderRepository.findOne({
      where: { userId: userPayload.id, apiPlanId: body.planId },
    });

    const orderData = {
      userId: userPayload.id,
      userType: decrypt(userPayload.hashType),
      planId: body.planId,
      expiredDate: null,
      packageDate: null,
      subscriptionStatus:
        planInfo.name.toLowerCase() == 'free'
          ? SubscriptionStatusEnum.COMPLETE
          : SubscriptionStatusEnum.PENDING,
    };
    if (!isOrderExist) {
      await this.apiPlanOrderRepository.save(orderData);
    } else {
      const updatedData = {
        planId: body.planId,
        subscriptionStatus:
          planInfo.name.toLowerCase() == 'free'
            ? SubscriptionStatusEnum.COMPLETE
            : SubscriptionStatusEnum.PENDING,
      };
      await this.apiPlanOrderRepository.update(
        { userId: userPayload.id, apiPlanId: body.planId },
        updatedData,
      );
    }
    await this.apiPlanOrderRepository.save(orderData);

    return `order confirm successfully!!!`;
  }

  //   // paginated data package
  //   async paginatedAvailPlan(
  //     listQueryParam: PaginationOptionsInterface,
  //     userPayload: UserInterface,
  //   ) {
  //     const limit: number = listQueryParam.limit ? listQueryParam.limit : 10;
  //     const page: number = listQueryParam.page
  //       ? +listQueryParam.page == 1
  //         ? 0
  //         : listQueryParam.page
  //       : 1;
  //     const [results, total] = await this.packageRepository
  //       .createQueryBuilder('package')
  //       .where(`package.createdType = '${UserTypesEnum.ADMIN}'`) // Exclude packages with createdType = 'ADMIN'
  //       .andWhere(
  //         `package.id Not In (SELECT "packageId" FROM "packageOrder" where "subscriptionStatus" = 'complete' and "userId"= ${userPayload.id})`,
  //       )
  //       .orderBy('package.id', 'DESC')
  //       .take(limit)
  //       .skip(page > 0 ? page * limit - limit : page)
  //       .getManyAndCount();

  //     return new Pagination<PackageEntity>({
  //       results,
  //       total,
  //       currentPage: page === 0 ? 1 : page,
  //       limit,
  //     });
  //   }
  //   // paginated my subscription plan
  //   async paginatedMyPlan(
  //     listQueryParam: PaginationOptionsInterface,
  //     userPayload: UserInterface,
  //   ) {
  //     const limit: number = listQueryParam.limit ? listQueryParam.limit : 10;
  //     const page: number = listQueryParam.page
  //       ? +listQueryParam.page == 1
  //         ? 0
  //         : listQueryParam.page
  //       : 1;
  //     const [results, total] = await this.orderRepository
  //       .createQueryBuilder('order')
  //       .leftJoinAndMapOne(
  //         'order.package',
  //         PackageEntity,
  //         'package',
  //         `order.packageId = package.id`,
  //       )
  //       .where(`order.subscriptionStatus = '${SubscriptionStatusEnum.COMPLETE}'`)
  //       .andWhere(`order.userId = ${userPayload.id}`)
  //       .orderBy('package.id', 'DESC')
  //       .take(limit)
  //       .skip(page > 0 ? page * limit - limit : page)
  //       .getManyAndCount();

  //     return new Pagination<OrderEntity>({
  //       results,
  //       total,
  //       currentPage: page === 0 ? 1 : page,
  //       limit,
  //     });
  //   }

  //   // get package by id

  //   async getPackageById(id: number) {
  //     const data = await this.packageRepository.findOne({
  //       where: { id: id },
  //     });
  //     return data;
  //   }

  //   get order by userID

  async getApiPlanOrderByUserId(userId: number) {
    const data = await this.apiPlanOrderRepository
      .createQueryBuilder('order')
      .leftJoinAndMapOne(
        'order.plan',
        ApiPlanOrderEntity,
        'apiplan',
        `order.apiPlanId = apiplan.id`,
      )
      .where(`order.userId = ${userId}`)
      .andWhere(
        `order.subscriptionStatus = '${SubscriptionStatusEnum.COMPLETE}'`,
      )
      .getOne();

    if (data) {
      return data;
    } else {
      throw new BadRequestException(`Data not Found!`);
    }
  }

  // find all order
  async findAllOrder(
    listQueryParam: PaginationOptionsInterface,
    filter: any,
    userPayload: UserInterface,
  ) {
    if (decrypt(userPayload.hashType) !== UserTypesEnum.ADMIN) {
      throw new BadRequestException(
        'You are not allow to see any kind of Blog',
      );
    }
    const limit: number = listQueryParam.limit ? listQueryParam.limit : 10;
    const page: number = listQueryParam.page
      ? +listQueryParam.page == 1
        ? 0
        : listQueryParam.page
      : 1;

    const [results, total] = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndMapOne(
        'order.user',
        UserEntity,
        'user',
        `order.userId = user.id`,
      )
      .where(
        new Brackets((qb) => {
          if (filter) {
            qb.where(`user.name ILIKE ('%${filter}%')`);
          }
        }),
      )
      .orderBy('order.id', 'DESC')
      .take(limit)
      .skip(page > 0 ? page * limit - limit : page)
      .getManyAndCount();

    return new Pagination<OrderEntity>({
      results,
      total,
      currentPage: page === 0 ? 1 : page,
      limit,
    });
  }
}
