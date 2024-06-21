import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { AttendanceService } from './attendance.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { AttendanceSheetQueryDto, QueryAttendanceDto, QueryLessonsDto } from './dto/query-attendance.dto';

@ApiTags('Attendance')
@ApiBearerAuth()
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  /** Attendance history. Students automatically get only their own records. */
  @Get()
  findAll(@Query() query: QueryAttendanceDto, @CurrentUser() user: AuthUser) {
    return this.attendanceService.findAll(query, user);
  }

  @Roles(Role.STUDENT)
  @Get('me/summary')
  mySummary(@CurrentUser('id') userId: string) {
    return this.attendanceService.summaryForUser(userId);
  }

  @Roles(Role.ADMIN, Role.TEACHER)
  @Get('sheet')
  sheet(@Query() query: AttendanceSheetQueryDto, @CurrentUser() user: AuthUser) {
    return this.attendanceService.sheet(query.groupId, query.date, user);
  }

  @Roles(Role.ADMIN, Role.TEACHER)
  @Post()
  mark(@Body() dto: MarkAttendanceDto, @CurrentUser() user: AuthUser) {
    return this.attendanceService.mark(dto, user);
  }

  @Roles(Role.ADMIN, Role.TEACHER)
  @Get('lessons')
  lessons(@Query() query: QueryLessonsDto, @CurrentUser() user: AuthUser) {
    return this.attendanceService.lessons(query, user);
  }
}
