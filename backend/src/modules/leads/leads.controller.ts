import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { UuidPipe } from '../../common/utils/parse-uuid.pipe';
import { ConvertLeadDto } from './dto/convert-lead.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import { QueryLeadsDto } from './dto/query-leads.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadsService } from './leads.service';

@ApiTags('Leads')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  findAll(@Query() query: QueryLeadsDto) {
    return this.leadsService.findAll(query);
  }

  @Get('assignees')
  assignees() {
    return this.leadsService.assignees();
  }

  @Get('stats')
  stats() {
    return this.leadsService.stats();
  }

  @Get(':id')
  findOne(@Param('id', UuidPipe) id: string) {
    return this.leadsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateLeadDto) {
    return this.leadsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', UuidPipe) id: string, @Body() dto: UpdateLeadDto) {
    return this.leadsService.update(id, dto);
  }

  @Post(':id/convert')
  convert(@Param('id', UuidPipe) id: string, @Body() dto: ConvertLeadDto) {
    return this.leadsService.convert(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', UuidPipe) id: string) {
    return this.leadsService.remove(id);
  }
}
