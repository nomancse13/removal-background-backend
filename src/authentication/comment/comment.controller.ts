import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CommentService } from './comment.service';
import { AtGuard } from '../auth/guards';

@ApiTags('Comments')
@ApiBearerAuth('jwt')
@UseGuards(AtGuard)
@Controller({
  path: 'comment',
  version: '1',
})
export class CommentController {
  constructor(private readonly commentService: CommentService) {}
}
