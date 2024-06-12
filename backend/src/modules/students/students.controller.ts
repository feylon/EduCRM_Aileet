import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { UuidPipe } from '../../common/utils/parse-uuid.pipe';
import { CreateStudentDto } from './dto/create-student.dto';
import { QueryStudentsDto } from './dto/query-students.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentsService } from './students.service';

@ApiTags('Students')
@ApiBearerAuth()
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  /** Admins see all students, teachers — students of their own groups. */
  @Roles(Role.ADMIN, Role.TEACHER)
  @Get()
  findAll(@Query() query: QueryStudentsDto, @CurrentUser() user: AuthUser) {
    return this.studentsService.findAll(query, user);
  }

  @Roles(Role.STUDENT)
  @Get('me')
  me(@CurrentUser('id') userId: string) {
    return this.studentsService.findByUserId(userId);
  }

  @Roles(Role.ADMIN, Role.TEACHER)
  @Get(':id')
  findOne(@Param('id', UuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.studentsService.findOne(id, user);
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateStudentDto) {
    return this.studentsService.create(dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id', UuidPipe) id: string, @Body() dto: UpdateStudentDto) {
    return this.studentsService.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', UuidPipe) id: string) {
    return this.studentsService.remove(id);
  }
}
