import { UsersService } from 'src/user/user.service';
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuards } from 'src/auth/guards';
import { Public } from 'src/auth/decorators';
import { RoleUpdateDto } from './dto/role.update.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@ApiTags('User')
@ApiBearerAuth()
@UseGuards(JwtAuthGuards)
@Controller('user')
export class UserController {
  constructor(private readonly UsersService: UsersService) {}

  @Patch()
  @ApiBody({ type: UpdateUserDto })
  @ApiOkResponse({ type: User })
  updateUser(@Request() req, @Body() dto: UpdateUserDto): Promise<User> {
    return this.UsersService.updateUser(req.user.sub, dto);
  }



  @Get('/test')
  test() {
    return 'test';
  }
}
