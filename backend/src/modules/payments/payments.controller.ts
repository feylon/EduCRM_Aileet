import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { UuidPipe } from '../../common/utils/parse-uuid.pipe';
import { DebtsService } from './debts.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { QueryPaymentsDto } from './dto/query-payments.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly debtsService: DebtsService,
  ) {}

  @Roles(Role.ADMIN)
  @Get()
  findAll(@Query() query: QueryPaymentsDto) {
    return this.paymentsService.findAll(query);
  }

  @Roles(Role.ADMIN)
  @Get('summary')
  summary(@Query() query: QueryPaymentsDto) {
    return this.paymentsService.summary(query);
  }

  @Roles(Role.ADMIN)
  @Get('debtors')
  debtors(@Query() query: PaginationQueryDto) {
    return this.debtsService.debtors(query);
  }

  @Roles(Role.ADMIN)
  @Get('students/:studentId/balance')
  balance(@Param('studentId', UuidPipe) studentId: string) {
    return this.debtsService.forStudent(studentId);
  }

  @Roles(Role.STUDENT)
  @Get('me')
  mine(@CurrentUser('id') userId: string, @Query() query: QueryPaymentsDto) {
    return this.paymentsService.forUser(userId, query);
  }

  @Roles(Role.ADMIN)
  @Get(':id')
  findOne(@Param('id', UuidPipe) id: string) {
    return this.paymentsService.findOne(id);
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreatePaymentDto, @CurrentUser() user: AuthUser) {
    return this.paymentsService.create(dto, user);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id', UuidPipe) id: string, @Body() dto: UpdatePaymentDto) {
    return this.paymentsService.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', UuidPipe) id: string) {
    return this.paymentsService.remove(id);
  }
}
