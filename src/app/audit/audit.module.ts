import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { AuditPersistenceModule } from './application/persistence/audit-persistence.module';
import { FindAllAuditLog } from './application/usecases/find-all-audit-log/find-all-audit-log.service';
import { RecordJobAudit } from './application/usecases/record-job-audit/record-job-audit.service';
import { AuditLogAdminController } from './infra/drivers/http/admin/audit-log-admin.controller';
import { AuditInterceptor } from './infra/interceptors/audit.interceptor';

@Module({
  imports: [
    AuditPersistenceModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    AuditLogAdminController,
  ],
  providers: [
    FindAllAuditLog,
    RecordJobAudit,
    AuditInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
  exports: [
    AuditInterceptor,
    RecordJobAudit,
  ],
})
export class AuditModule {}
