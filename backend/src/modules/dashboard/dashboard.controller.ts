import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Roles(Role.ADMIN)
  @Get('statistics')
  statistics(@CurrentUser() user: AuthUser) {
    return this.dashboardService.statistics(user);
  }

  @Roles(Role.ADMIN)
  @Get('charts')
  charts() {
    return this.dashboardService.charts();
  }

  @Roles(Role.TEACHER)
  @Get('teacher')
  teacher(@CurrentUser() user: AuthUser) {
    return this.dashboardService.teacher(user);
  }

  @Roles(Role.STUDENT)
  @Get('student')
  student(@CurrentUser() user: AuthUser) {
    return this.dashboardService.student(user);
  }
}
