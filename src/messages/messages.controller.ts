import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createMessageDto: CreateMessageDto, @Request() req) {
    return this.messagesService.create(createMessageDto, req.user.id);
  }

  @Get('room/:roomId')
  @UseGuards(JwtAuthGuard)
  getRoomMessages(
    @Param('roomId') roomId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
    @Request() req,
  ) {
    return this.messagesService.getRoomMessages(
      roomId,
      req.user.id,
      parseInt(page),
      parseInt(limit),
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @Request() req) {
    return this.messagesService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateMessageDto: any, @Request() req) {
    return this.messagesService.update(id, updateMessageDto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Request() req) {
    return this.messagesService.remove(id, req.user.id);
  }

  @Get('search/:roomId')
  @UseGuards(JwtAuthGuard)
  searchMessages(
    @Param('roomId') roomId: string,
    @Query('q') query: string,
    @Request() req,
  ) {
    return this.messagesService.searchMessages(query, roomId, req.user.id);
  }
}
