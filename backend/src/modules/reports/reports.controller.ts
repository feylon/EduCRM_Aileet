import { Controller, Get, Header, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiProduces, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { SkipTransform } from '../../common/decorators/skip-transform.decorator';
import { Role } from '../../common/enums/role.enum';
import { ReportQueryDto } from './dto/report-query.dto';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('finance')
  finance(@Query() query: ReportQueryDto) {
    return this.reportsService.finance(query);
  }

  @Get('attendance')
  attendance(@Query() query: ReportQueryDto) {
    return this.reportsService.attendanceReport(query);
  }

  @Get('teachers')
  teachers(@Query() query: ReportQueryDto) {
    return this.reportsService.teachersReport(query);
  }

  @Get('students')
  students(@Query() query: ReportQueryDto) {
    return this.reportsService.studentsReport(query);
  }

  @Get('payments/export')
  @SkipTransform()
  @ApiProduces('text/csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="payments.csv"')
  exportPayments(@Query() query: ReportQueryDto) {
    return this.reportsService.paymentsCsv(query);
  }
}
