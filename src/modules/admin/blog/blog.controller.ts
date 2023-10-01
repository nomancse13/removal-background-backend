import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Delete,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AdminGuard } from 'src/authentication/auth/guards';
import { BlogService } from './blog.service';
import { CreateBlogDto, UpdateBlogDto } from './dtos';
import { UserPayload } from 'src/authentication/utils/decorators';
import { PaginationOptionsInterface, UserInterface } from 'src/authentication/common/interfaces';
import { HardDeleteDto } from 'src/authentication/utils/dtos';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

@ApiTags('Admin|Blog')
@ApiBearerAuth('jwt')
@UseGuards(AdminGuard)
@Controller({
  path: 'blog',
  version: '1',
})
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  /**
   * CREATE -> Blog
   */
  @ApiOperation({
    summary: 'create a blog',
    description: 'this route is responsible for creating a new blog',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          cb(null, file.originalname);
        },
      }),
    }),)
  @ApiBody({
    type: CreateBlogDto,
    description:
      'How to create a blog with body?... here is the example given below!',
    examples: {
      a: {
        summary: 'default',
        value: {
          title: 'The Most Expensive Cities for International Students',
          content: '<p>sdfasdfas</p>',
          summary: '<p>asdfsdfa</p>',
          slug: 'the-most-expensive-cities-for-international-students',
          status: 'Draft',
          isFeatured: 1,
          isMustRead: 0,
          metaTitle: 'asdfasd',
          metaDescription: 'adfadsf',
          metaKeyword: 'software',
          publishDate: '2022-06-09T18:00:00.000Z',
        } as unknown as CreateBlogDto,
      },
    },
  })
  @Post()
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createBlogDto: CreateBlogDto,
    @UserPayload() userPayload: UserInterface,
  ) {
    
    const data = await this.blogService.createBlog(createBlogDto, userPayload, file);
    return { message: 'successful', result: data };
  }


  // get all blog data with paginaiton
  @ApiOperation({
    summary: 'get all blog data with pagination',
    description:
      'this route is responsible for getting all blog data with pagination',
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
  async packageData(
    @Query() listQueryParam: PaginationOptionsInterface,
    @Query('filter') filter: any,
    @UserPayload() userPayload: UserInterface,
  ) {
    const result = await this.blogService.filterBlog(
      listQueryParam,
      filter,
      userPayload
    );

    return { message: 'successful', result: result };
  }
  /**
   * GET ONE -> blog
   */
  @Get(':blogId')
  @ApiOperation({
    summary: 'get one blog',
  })
  @ApiParam({
    name: 'blogId',
    type: Number,
    description: 'For single fetch required blogId',
    required: true,
  })
  async getOne(@Param('blogId') blogId: number,  @UserPayload() userPayload: UserInterface,
  ) {
    const data = await this.blogService.getOneBlog(blogId, userPayload);
    return { message: 'successful', result: data };
  }

  /**
   * DELETE -> Blog
   */
  // delete single plan
  @ApiOperation({
    summary: 'delete single blog by id',
    description: 'this route is responsible for delete a single blog by id',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'delete single blog required id',
    required: true,
  })
  @Delete(':id')
  async deleteBlog(
    @Param('id') id: number,
    @UserPayload() userPayload: UserInterface,
  ) {
    const data = await this.blogService.deleteBlog(id, userPayload);
    return { message: 'successful!', result: data };
  }

  /**
   * UPDATE -> Blog
   */
  @Patch(':blogId')
  @ApiOperation({
    summary: 'update a existing blog',
  })
  @ApiParam({
    name: 'blogId',
    type: Number,
    description: 'For update required blogId',
    required: true,
  })
  @ApiBody({
    type: UpdateBlogDto,
    description:
      'How to update a blog with body?... here is the example given below!',
    examples: {
      a: {
        summary: 'default',
        value: {
          title: 'The Most Expensive Cities for International Students',
          content: '<p>sdfasdfas</p>',
          summary: '<p>asdfsdfa</p>',
          slug: 'the-most-expensive-cities-for-international-students',
          status: 'Draft',
          isFeatured: 1,
          isMustRead: 0,
          link: 'https://dev.myunisearch.com/blog/london-universities-plan-%22leading%22-international-strategy',
          metaTitle: 'asdfasd',
          metaDescription: 'adfadsf',
          metaKeyword: 'software',
          publishDate: '2022-06-09T18:00:00.000Z',
        } as unknown as UpdateBlogDto,
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          cb(null, file.originalname);
        },
      }),
    }),)
  async update(
    @Param('blogId') blogId: number,
    @Body() updateBlogDto: UpdateBlogDto,
    @UserPayload() userPayload: UserInterface,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const data = await this.blogService.updateBlog(
      blogId,
      updateBlogDto,
      userPayload,
      file,
    );
    return { message: 'successful', result: data };
  }
}
