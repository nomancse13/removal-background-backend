import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { decrypt } from 'src/helper/crypto.helper';
import { BaseRepository } from 'typeorm-transactional-cls-hooked';
import { CreatePriceFixingDto, UpdatePriceFixingDto } from './dtos';
import { PriceFixingEntity } from './entity';
import { Pagination, PaginationOptionsInterface, UserInterface } from 'src/authentication/common/interfaces';
import { ErrorMessage, StatusField, SubscriptionStatusEnum, UserTypesEnum } from 'src/authentication/common/enum';
import { CreateCustomPackageDto } from './dtos/create-custom-package.dto';
import { OrderEntity } from 'src/modules/user/order/entity/order.entity';

export class PriceFixingService {
  constructor(
    @InjectRepository(PriceFixingEntity)
    private priceFixingRepository: BaseRepository<PriceFixingEntity>,
    @InjectRepository(OrderEntity)
    private orderRepository: BaseRepository<OrderEntity>,
  ) {}

  //  add price for module
  async createPriceFix(
    createPriceFixingDto: CreatePriceFixingDto,
    userPayload: UserInterface,
  ) {
    if (decrypt(userPayload.hashType) !== UserTypesEnum.ADMIN) {
      throw new BadRequestException(
        `You are not allow to add any kind of price`,
      );
    }
    createPriceFixingDto['createdBy'] = userPayload.id;

    const data = await this.priceFixingRepository.save(createPriceFixingDto);
    return data;
  }

  // update price by id

  async updatePrice(
    id: number,
    userPayload: UserInterface,
    updatePriceFixingDto: UpdatePriceFixingDto,
  ) {
    if (decrypt(userPayload.hashType) !== UserTypesEnum.ADMIN) {
      throw new BadRequestException(
        `You are not allow to update any kind of price fixing`,
      );
    }
    updatePriceFixingDto['updatedBy'] = userPayload.id;

    const updatedData = await this.priceFixingRepository
      .createQueryBuilder()
      .update(PriceFixingEntity, updatePriceFixingDto)
      .where(`id = ${id}`)
      .execute();

    if (updatedData.affected == 0) {
      throw new BadRequestException(ErrorMessage.UPDATE_FAILED);
    }

    return updatedData.raw[0];
  }

  // get single price fixing

  async getSinglePrice(id: number, userPayload: UserInterface) {
    if (decrypt(userPayload.hashType) !== UserTypesEnum.ADMIN) {
      throw new BadRequestException(
        `You are not allow to see any kind of fixing price`,
      );
    }
    const data = await this.priceFixingRepository.findOne({
      where: { id: id },
    });
    return data;
  }

  // paginated data PriceFixing
  async paginatedPriceFixing(
    listQueryParam: PaginationOptionsInterface,
    filter: any,
  ) {
    const limit: number = listQueryParam.limit ? listQueryParam.limit : 10;
    const page: number = listQueryParam.page
      ? +listQueryParam.page == 1
        ? 0
        : listQueryParam.page
      : 1;
    const [results, total] = await this.priceFixingRepository
      .createQueryBuilder('package')
      .orderBy('package.id', 'DESC')
      .take(limit)
      .skip(page > 0 ? page * limit - limit : page)
      .getManyAndCount();

    return new Pagination<PriceFixingEntity>({
      results,
      total,
      currentPage: page === 0 ? 1 : page,
      limit,
    });
  }

  // delete PriceFixingModule by id
  async deletePriceFixing(id: number, userPayload: UserInterface) {
    if (decrypt(userPayload.hashType) !== UserTypesEnum.ADMIN) {
      throw new BadRequestException(
        `You are not allow to delete any kind of Price `,
      );
    }

    const data = await this.priceFixingRepository.delete({
      id: id,
    });

    return data.affected > 0
      ? 'Deleted Successfully!'
      : ErrorMessage.DELETE_FAILED;
  }

  // custom order creation

  async createCustomOrder(
    dto: CreateCustomPackageDto,
    userPayload: UserInterface,
  ) {

    if (decrypt(userPayload.hashType) !== UserTypesEnum.CLIENT) {
      throw new BadRequestException(
        `You are not allow to order any kind of custom service. Please sign in as client and then try again.`,
      );
    }
    const costOfImage = await this.priceFixingRepository.findOne({where: {status: StatusField.ACTIVE}});

    const totalCost =
      dto.quantity * costOfImage.price;

    if (totalCost != dto.totalCost) {
      throw new BadRequestException(
        `total cost you provided is not correct!!! please check and give the correct cost.`,
      );
    }

    const saveData = {
      planId: 0,
      userId: userPayload.id,
      userType: decrypt(userPayload.hashType),
      subscriptionStatus: SubscriptionStatusEnum.PENDING,
      packageDate: Date.now()
    }

    const data = await this.orderRepository.save(saveData);

    if(data){
      return data;
    }else{
      throw new BadRequestException(`data is not saved!`);
    }
  }
}
