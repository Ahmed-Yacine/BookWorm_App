import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  Param,
  ParseIntPipe,
  Get,
  Delete,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { AuthGuard } from '../user/guards/auth.guard';
import { CreateCommentDto } from './dtos/create-comment.dto';

@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get('/post/:postId')
  public getComments(@Param('postId', ParseIntPipe) postId: number) {
    return this.commentService.getComments(postId);
  }

  @Post('/post/:postId')
  @UseGuards(AuthGuard)
  public createComment(
    @Param('postId', ParseIntPipe) postId: number,
    @Body() createCommentDto: CreateCommentDto,
    @Request() req: any,
  ) {
    return this.commentService.createComment(
      postId,
      createCommentDto,
      req.user.id,
    );
  }

  @Delete(':commentId')
  @UseGuards(AuthGuard)
  public deleteComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Request() req: any,
  ) {
    return this.commentService.deleteComment(commentId, req.user.id);
  }

  @Post(':commentId/toggleLike')
  @UseGuards(AuthGuard)
  public toggleLikeComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Request() req: any,
  ) {
    return this.commentService.toggleLikeComment(commentId, req.user.id);
  }
}
