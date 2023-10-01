
import { Body, Controller, Get, Post, Query, Param } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CommentService } from 'src/authentication/comment/comment.service';
import { CreateCommentDto } from 'src/authentication/comment/dtos';
import { PaginationOptionsInterface, UserInterface } from 'src/authentication/common/interfaces';
import { UserPayload } from 'src/authentication/utils/decorators';
import { BlogService } from 'src/modules/admin/blog/blog.service';
@ApiTags('Public|Comments')
@Controller({
  path: 'comment',
  version: '1',
})
export class PublicCommentController {
  constructor(private readonly commentService: CommentService, private readonly blogService: BlogService) {}

  /**
   * CREATE NEW COMMENT
   */
  @Post()
  @ApiOperation({
    summary: 'Create a New Comment',
  })
  @ApiBody({
    type: CreateCommentDto,
    description:
      'How to create a public comment with body?... here is the example given below!',
    examples: {
      a: {
        summary: 'default',
        value: {
          referenceId: 75,
          userType: 'student',
          userId: 20,
          content: 'string',
        } as unknown as CreateCommentDto,
      },
    },
  })
  async createComment(@Body() createCommentDto: CreateCommentDto) {
    
    const data = await this.commentService.createComment(createCommentDto);

    return { message: 'successful', result: data };
  }

  /**
   * Get One Comment
   */
//   @Get()
//   @ApiOperation({
//     summary: 'get Comment List',
//     description: 'commentType and slug are required query parameters',
//   })
//   async getComment(
//     @Query('commentType') commentType: CommentTypeEnum,
//     @Query('referenceId') referenceId: number,
//   ) {
//     const data = await this.commentService.getComment(commentType, referenceId);

//     return { message: 'successful', result: data };
//   }


  // get all comment data with paginaiton
  @ApiOperation({
    summary: 'get all comment data by blog id',
    description:
      'this route is responsible for getting all comment data with pagination by blog Id',
  })
  @ApiParam({
    name: 'blogId',
    type: Number,
    description: 'get all comment required blogId',
    required: true,
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
  @Get(':blogId')
  async commentData(
    @Query() listQueryParam: PaginationOptionsInterface,
    @Param('blogId') blogId: number,
  ) {
    const result = await this.commentService.paginatedCommentByBlogId(
      listQueryParam,
      blogId
    );

    return { message: 'successful', result: result };
  }

   /**
   * GET ONE -> blog with comment
   */
   @Get('/single/blog/:blogId')
   @ApiOperation({
     summary: 'get one blog with comment',
   })
   @ApiParam({
     name: 'blogId',
     type: Number,
     description: 'For single blog with comment required blogId',
     required: true,
   })
   async getOne(@Param('blogId') blogId: number
   ) {
     const data = await this.blogService.getOneBlogWithComment(blogId);
     return { message: 'successful', result: data };
   }
}
