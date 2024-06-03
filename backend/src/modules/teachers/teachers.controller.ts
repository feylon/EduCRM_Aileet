import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { UuidPipe } from '../../common/utils/parse-uuid.pipe';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { QueryTeachersDto } from './dto/query-teachers.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { TeachersService } from './teachers.service';

@ApiTags('Teachers')
@ApiBearerAuth()
@Controller('teachers')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Roles(Role.ADMIN)
  @Get()
  findAll(@Query() query: QueryTeachersDto) {
    return this.teachersService.findAll(query);
  }

  @Roles(Role.TEACHER)
  @Get('me')
  me(@CurrentUser('id') userId: string) {
    return this.teachersService.findByUserId(userId);
  }

  @Roles(Role.ADMIN)
  @Get(':id')
  findOne(@Param('id', UuidPipe) id: string) {
    return this.teachersService.findOne(id);
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateTeacherDto) {
    return this.teachersService.create(dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id', UuidPipe) id: string, @Body() dto: UpdateTeacherDto) {
    return this.teachersService.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', UuidPipe) id: string) {
    return this.teachersService.remove(id);
  }
}
