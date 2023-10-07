import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';
import * as randToken from 'rand-token';
import { Brackets } from 'typeorm';
import {
  BaseRepository,
  Transactional,
} from 'typeorm-transactional-cls-hooked';
import { CreateBlogDto, UpdateBlogDto } from './dtos';
import { BlogEntity } from './entities';
import {
  Pagination,
  PaginationOptionsInterface,
  UserInterface,
} from 'src/authentication/common/interfaces';
import { CurrentDate } from 'src/helper/date-time-helper';
import {
  ErrorMessage,
  StatusField,
  SuccessMessage,
  UserTypesEnum,
} from 'src/authentication/common/enum';
import { HardDeleteDto } from 'src/authentication/utils/dtos';
import slugGenerator from 'src/helper/slugify.helper';
import { decrypt } from 'src/helper/crypto.helper';
import { CommentEntity } from 'src/authentication/comment/entities';

@Injectable()
export class BlogService {
  _client = new Redis({});

  constructor(
    @InjectRepository(BlogEntity)
    private blogRepository: BaseRepository<BlogEntity>,
  ) {}

  /**
   * CREATE -> Blog
   */
  async createBlog(
    createDto: CreateBlogDto,
    userPayload: UserInterface,
    file: any,
  ) {
    const { id } = userPayload;

    createDto['createdBy'] = id;
    createDto['createdType'] = decrypt(userPayload.hashType);
    createDto['publishDate'] = createDto.publishDate
      ? CurrentDate(createDto.publishDate)
      : null;
    createDto['featureImgSrc'] = file ? file.originalname : null;

    let slug = slugGenerator(createDto.title);
    const check = await this.blogRepository.findOne({
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
    createDto['slug'] = slug;

    try {
      //blog data saved
      const blogData: any = createDto;
      const data = await this.blogRepository.save(createDto);
      // adding blog category reference
      if (data) {
        return data;
      }
    } catch (error) {
      throw new BadRequestException(ErrorMessage.INSERT_FAILED);
    }
  }

  /**
   * UPDATE -> Blog
   */
  async updateBlog(
    blogId: number,
    updateDto: UpdateBlogDto,
    userPayload: UserInterface,
    file: any,
  ) {
    const { id } = userPayload;
    updateDto['updatedType'] = decrypt(userPayload.hashType);

    // update auto generated slug
    const title = await this.blogRepository.findOne({
      select: ['id', 'title', 'slug', 'featureImgSrc'],
      where: {
        id: id,
      },
    });

    updateDto['featureImgSrc'] = file ? file.originalname : title.featureImgSrc;

    if (!title || !title.slug) {
      let slug = slugGenerator(updateDto.title);
      const check = await this.blogRepository.findOne({
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
      updateDto['slug'] = slug;
    }

    updateDto['publishDate'] = updateDto.publishDate
      ? CurrentDate(updateDto.publishDate)
      : null;

    // update blog
    const updateData: any = updateDto;
    try {
      const data = await this.blogRepository
        .createQueryBuilder()
        .update(BlogEntity, updateData)
        .where(`id = '${blogId}'`)
        .execute();

      return `updated successfully!`;
    } catch (e) {
      throw new BadRequestException('Not updated');
    }
  }

  /**
   * GET LIST -> Blog
   */
  async filterBlog(
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

    const [results, total] = await this.blogRepository
      .createQueryBuilder('blog')
      .where(
        new Brackets((qb) => {
          if (filter) {
            qb.where(`blog.title ILIKE ('%${filter}%')`);
          }
        }),
      )
      .andWhere(`blog.status = '${StatusField.ACTIVE}'`)
      .orderBy('blog.id', 'DESC')
      .take(limit)
      .skip(page > 0 ? page * limit - limit : page)
      .withDeleted()
      .getManyAndCount();

    return new Pagination<BlogEntity>({
      results,
      total,
      currentPage: page === 0 ? 1 : page,
      limit,
    });
  }

  /**
   * GET ONE -> blog
   */
  async getOneBlog(blogId: number, userPayload: UserInterface) {
    if (decrypt(userPayload.hashType) !== UserTypesEnum.ADMIN) {
      throw new BadRequestException(
        'You are not allow to see any kind of blog',
      );
    }
    const data: any = await this.blogRepository
      .createQueryBuilder('blog')
      .where(`blog.id = ${blogId}`)
      .select(['blog'])
      .withDeleted()
      .getOne();

    if (!data) {
      throw new NotFoundException(ErrorMessage.RECORD_NOT_FOUND);
    }
    return data;
  }

  /**
   * HARD DELETE -> Blog
   */
  // delete blog by id
  async deleteBlog(id: number, userPayload: UserInterface) {
    if (decrypt(userPayload.hashType) !== UserTypesEnum.ADMIN) {
      throw new BadRequestException(
        'You are not allow to delete any kind of blog',
      );
    }
    const data = await this.blogRepository.delete({
      id: id,
    });

    if (data.affected == 0) {
      throw new BadRequestException(`Failed to Delete!!`);
    }

    return `Delete Successfully!!`;
  }

  /***
   *
   *
   * Public blog service
   *
   *
   */
  async getBlogPage() {
    const getLatestFiveBlog = await this.blogRepository
      .createQueryBuilder('blog')
      .where('blog.status = :status', {
        status: StatusField.ACTIVE,
      })
      .select(['blog'])
      .orderBy('blog.id', 'DESC')
      .limit(5)
      .getMany();

    return getLatestFiveBlog
      ? getLatestFiveBlog
      : ErrorMessage.RECORD_NOT_FOUND;
  }

  // get comment by blogId

  async getOneBlogWithComment(blogId: number) {
    const data: any = await this.blogRepository
      .createQueryBuilder('blog')
      .leftJoinAndMapMany(
        'blog.comment',
        CommentEntity,
        'comment',
        `blog.id = comment.blogId `,
      )
      .where(`blog.id = ${blogId}`)
      .getOne();

    if (!data) {
      throw new NotFoundException(ErrorMessage.RECORD_NOT_FOUND);
    }
    return data;
  }
}
