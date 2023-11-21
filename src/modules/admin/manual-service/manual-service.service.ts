import { InjectRepository } from '@nestjs/typeorm';
import { Brackets } from 'typeorm';
import { BaseRepository } from 'typeorm-transactional-cls-hooked';
import {
  Pagination,
  PaginationOptionsInterface,
  UserInterface,
} from 'src/authentication/common/interfaces';
import { StatusField, UserTypesEnum } from 'src/authentication/common/enum';
import { BadRequestException } from '@nestjs/common';
import { ManualServiceEntity } from './entity';
import { CreateManualServiceDto, UpdateManualServiceDto } from './dtos';
import { decrypt } from 'src/helper/crypto.helper';

export class ManualService {
  constructor(
    @InjectRepository(ManualServiceEntity)
    private manualRepository: BaseRepository<ManualServiceEntity>,
  ) {}

  //   create manual service
  async createManualService(
    createManualServiceDto: CreateManualServiceDto,
    userPayload: UserInterface,
  ) {
    createManualServiceDto['createdBy'] = userPayload.id;

    const data = await this.manualRepository.save(createManualServiceDto);
    return data;
  }

  // update manual service by id

  async updateManualService(
    id: number,
    userPayload: UserInterface,
    updateManualServiceDto: UpdateManualServiceDto,
  ) {
    updateManualServiceDto['updatedBy'] = userPayload.id;

    const updatedData = await this.manualRepository
      .createQueryBuilder()
      .update(ManualServiceEntity, updateManualServiceDto)
      .where(`id = ${id}`)
      .execute();

    return updatedData.affected == 1
      ? 'updated successfully!'
      : 'updated failed!';
  }

  // get single manual service

  async getSingleManualService(id: number, userPayload: UserInterface) {
    const data = await this.manualRepository.findOne({
      where: { id: id, createdBy: userPayload.id },
    });
    if (data) {
      return data;
    } else {
      throw new BadRequestException(`manual service not Found!`);
    }
  }

  // get single manual service

  async getSingleManualServiceForAll(id: number) {
    const data = await this.manualRepository.findOne({
      where: { id: id },
    });

    if (data) {
      return data;
    } else {
      throw new BadRequestException(`manual service not Found!`);
    }
  }
  // paginated data manual service
  async paginatedManualService(
    listQueryParam: PaginationOptionsInterface,
    filter: any,
    userPayload: UserInterface,
  ) {
    if (decrypt(userPayload.hashType) !== UserTypesEnum.ADMIN) {
      throw new BadRequestException(
        'You are not allow to see any kind of manual service data',
      );
    }
    const limit: number = listQueryParam.limit ? listQueryParam.limit : 10;
    const page: number = listQueryParam.page
      ? +listQueryParam.page == 1
        ? 0
        : listQueryParam.page
      : 1;

    const [results, total] = await this.manualRepository
      .createQueryBuilder('manual')
      .where(
        new Brackets((qb) => {
          if (filter) {
            qb.where(`manual.name ILIKE ('%${filter}%')`);
          }
        }),
      )
      .andWhere(`manual.status = '${StatusField.ACTIVE}'`)
      .orderBy('manual.id', 'DESC')
      .take(limit)
      .skip(page > 0 ? page * limit - limit : page)
      .getManyAndCount();

    return new Pagination<ManualServiceEntity>({
      results,
      total,
      currentPage: page === 0 ? 1 : page,
      limit,
    });
  }

  // delete manual service by id
  async deleteManual(id: number, userPayload: UserInterface) {
    const data = await this.manualRepository.delete({
      id: id,
    });

    if (data.affected == 0) {
      throw new BadRequestException(`Failed to Delete!!`);
    }

    return `Delete Successfully!!`;
  }

  // _____________Public plan Showing_______

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

    const [results, total] = await this.manualRepository
      .createQueryBuilder('manual')
      .where(
        new Brackets((qb) => {
          if (filter) {
            qb.where(`manual.name ILIKE ('%${filter}%')`);
          }
        }),
      )
      .andWhere(`manual.status = '${StatusField.ACTIVE}'`)
      .select(['manual.name', 'manual.price', 'manual.quantity'])
      .orderBy('manual.id', 'DESC')
      .take(limit)
      .skip(page > 0 ? page * limit - limit : page)
      .getManyAndCount();

    return new Pagination<ManualServiceEntity>({
      results,
      total,
      currentPage: page === 0 ? 1 : page,
      limit,
    });
  }
}
