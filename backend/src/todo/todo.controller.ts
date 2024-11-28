import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { TodoService } from './todo.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuards } from 'src/auth/guards';
import { User } from 'src/user/entities/user.entity';

@ApiTags('Todo')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuards)
@Controller('todo')
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @Post()
  create(@Body() createTodoDto: CreateTodoDto, @Req() req) {
    console.log(req.user as User);
    return this.todoService.create(req.user.userId, createTodoDto);
  }

  @Get()
  findAll(@Req() req) {
    console.log(req.user)
    return this.todoService.findAll(req.user.userId);
  }

  
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTodoDto: UpdateTodoDto, ) {
    return this.todoService.update(+id, updateTodoDto,);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
      return this.todoService.remove(+id, );
  }
}
