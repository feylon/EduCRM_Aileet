import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { UuidPipe } from '../../common/utils/parse-uuid.pipe';
import { AddStudentsDto } from './dto/add-students.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { QueryGroupsDto } from './dto/query-groups.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupsService } from './groups.service';

@ApiTags('Groups')
@ApiBearerAuth()
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  /** Admins see all groups, teachers — their own, students — groups they study in. */
  @Get()
  findAll(@Query() query: QueryGroupsDto, @CurrentUser() user: AuthUser) {
    return this.groupsService.findAll(query, user);
  }

  @Get(':id')
  findOne(@Param('id', UuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.groupsService.findOne(id, user);
  }

  @Roles(Role.ADMIN, Role.TEACHER)
  @Get(':id/students')
  getStudents(@Param('id', UuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.groupsService.getStudents(id, user);
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateGroupDto) {
    return this.groupsService.create(dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id', UuidPipe) id: string, @Body() dto: UpdateGroupDto) {
    return this.groupsService.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', UuidPipe) id: string) {
    return this.groupsService.remove(id);
  }

  @Roles(Role.ADMIN)
  @Post(':id/students')
  addStudents(@Param('id', UuidPipe) id: string, @Body() dto: AddStudentsDto) {
    return this.groupsService.addStudents(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id/students/:studentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeStudent(@Param('id', UuidPipe) id: string, @Param('studentId', UuidPipe) studentId: string) {
    return this.groupsService.removeStudent(id, studentId);
  }
}
