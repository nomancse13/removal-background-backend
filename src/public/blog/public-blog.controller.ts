// src/background-removal/background-removal.controller.ts
import { Controller, Get, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BlogService } from 'src/modules/admin/blog/blog.service';

@ApiTags('Public|Blog')
@Controller({
  path: 'blog',
  version: '1',
})
export class PublicBlogController {
  constructor(private readonly blogService: BlogService) {}

  
  @Get()
  @ApiOperation({
    summary: 'blog page',
  })
  async getBlogPage() {
   
    const data = await this.blogService.getBlogPage();

    return { message: 'successful', result: data };
  }


}
