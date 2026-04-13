import { Controller, Get, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { AuditLogDto } from 'src/app/audit/application/dtos/audit-log.dto';
import { FindAllAuditLogQueryDto } from 'src/app/audit/application/usecases/find-all-audit-log/dtos/find-all-audit-log.dto';
import { FindAllAuditLog } from 'src/app/audit/application/usecases/find-all-audit-log/find-all-audit-log.service';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { Swagger } from 'src/infra/openapi/swagger';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/audit-log')
@RequiredRoles(AccountRole.ADMIN)
export class AuditLogAdminController {
  constructor(
    private readonly findAllAuditLog: FindAllAuditLog,
  ) {}

  @Get()
  @Swagger({
    tags: ['Auditoria'],
    summary: 'Listar logs de auditoria com paginação e filtros',
    applyBadRequest: true,
    okPaginatedResponse: AuditLogDto,
  })
  public findAll(@Query() queries: FindAllAuditLogQueryDto): Promise<IPagination<AuditLogDto>> {
    return this.findAllAuditLog.execute(queries);
  }
}
