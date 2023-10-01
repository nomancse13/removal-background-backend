import { InjectRepository } from '@nestjs/typeorm';
import { CommentEntity } from './entities';
import { BaseRepository } from 'typeorm-transactional-cls-hooked';
import { Injectable } from '@nestjs/common';
import { ErrorMessage, StatusField, UserTypesEnum } from '../common/enum';
import { CreateCommentDto } from './dtos';
import { UserService } from 'src/modules/user/user.service';
import { AuthService } from '../auth/auth.service';
import {
  Pagination,
  PaginationOptionsInterface,
  UserInterface,
} from '../common/interfaces';
import { decrypt } from 'src/helper/crypto.helper';
import { BlogEntity } from 'src/modules/admin/blog/entities';
import { Brackets } from 'typeorm';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(CommentEntity)
    private commentRepository: BaseRepository<CommentEntity>,
    private authService: AuthService,
  ) {}

  /**
   * CREATE NEW COMMENT
   */
  async createComment(createCommentDto: CreateCommentDto) {
    createCommentDto['isPublished'] = 0;
    createCommentDto['createdType'] = createCommentDto.userType;

    if (createCommentDto.userType !== 'guest') {
      const commentedUserData = await this.authService.userById(
        createCommentDto.userId,
      );

      if (commentedUserData) {
        createCommentDto['userName'] = commentedUserData.name;
        createCommentDto['userEmail'] = commentedUserData.email;
      }
    }

    const data = await this.commentRepository.save(createCommentDto);

    return data ? data : ErrorMessage.INSERT_FAILED;
  }

  /**
   * Get all comment
   */

  async paginatedCommentByBlogId(
    listQueryParam: PaginationOptionsInterface,
    blogId: number,
  ) {
    const limit: number = listQueryParam.limit ? listQueryParam.limit : 10;
    const page: number = listQueryParam.page
      ? +listQueryParam.page == 1
        ? 0
        : listQueryParam.page
      : 1;

    const [results, total] = await this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndMapOne(
        'comment.blog',
        BlogEntity,
        'blog',
        `comment.blogId = blog.id`,
      )
      .where(`comment.status = '${StatusField.ACTIVE}'`)
      .andWhere(`comment.blogId = ${blogId}`)
      .orderBy('comment.id', 'DESC')
      .take(limit)
      .skip(page > 0 ? page * limit - limit : page)
      .getManyAndCount();

    const modData: any = results;
    const blogData = modData && modData.length > 0 ? modData[0]?.blog : {};

    const data = [];

    if (results && results.length > 0) {
      await Promise.all(
        results.map((e: any) => {
          delete e?.blog;
          data.push({ ...e });
        }),
      );
    } else {
      data.push({});
    }

    return {
      blog: blogData,
      results: data,
      total,
      currentPage: page === 0 ? 1 : page,
      limit,
    };
  }

  // async getCommentByBlogId(blogId: number){
  //   const data = await this.commentRepository.
  // }
}
