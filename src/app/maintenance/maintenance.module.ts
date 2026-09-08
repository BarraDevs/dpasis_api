import { DynamicModule, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { ConfigModule } from 'src/core/config/config.module';
import { CompanyNfsConfigPersistenceModule } from 'src/app/company/company-nfs-config/application/persistence/company-nfs-config-persistence.module';
import { NfsePersistenceModule } from 'src/app/tax-invoice/nfse/application/persistence/nfse-persistence.module';
import { NfseModule } from 'src/app/tax-invoice/nfse/nfse.module';
import { Environment } from 'src/core/config/environment.enum';
import { AlertModule } from 'src/infra/alert/alert.module';
import { CheckAlertChannel } from './application/usecases/check-alert-channel/check-alert-channel.service';
import { CheckCertificates } from './application/usecases/check-certificates/check-certificates.service';
import { SweepNfseAlerts } from './application/usecases/sweep-nfse-alerts/sweep-nfse-alerts.service';
import { SweepNfseRecovery } from './application/usecases/sweep-nfse-recovery/sweep-nfse-recovery.service';
import { HealthAdminController } from './infra/drivers/http/admin/health-admin.controller';
import { NfseAlertsScheduler } from './infra/drivers/schedule/nfse-alerts.scheduler';

@Module({})
export class MaintenanceModule {
  static register(): DynamicModule {
    const isTest = process.env.NODE_ENV === Environment.Test;

    return {
      module: MaintenanceModule,
      imports: [
        ...(isTest ? [] : [ScheduleModule.forRoot()]),
        AlertModule.register(),
        NfsePersistenceModule,
        // `NfseModule` em vez de `NfseQueueModule.register()`: chamar `register()` de novo
        // registraria a fila BullMQ uma segunda vez. O `NfseModule` já a registra e a reexporta,
        // junto com os use cases que as varreduras usam.
        NfseModule,
        CompanyNfsConfigPersistenceModule,
        ConfigModule,
        AuthenticationGuardsModule,
      ],
      controllers: [
        HealthAdminController,
      ],
      providers: [
        CheckAlertChannel,
        CheckCertificates,
        SweepNfseAlerts,
        SweepNfseRecovery,
        ...(isTest ? [] : [NfseAlertsScheduler]),
      ],
      exports: [
        CheckAlertChannel,
        CheckCertificates,
        SweepNfseAlerts,
        SweepNfseRecovery,
      ],
    };
  }
}
