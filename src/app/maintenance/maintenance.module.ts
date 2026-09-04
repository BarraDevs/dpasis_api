import { DynamicModule, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { NfsePersistenceModule } from 'src/app/tax-invoice/nfse/application/persistence/nfse-persistence.module';
import { NfseModule } from 'src/app/tax-invoice/nfse/nfse.module';
import { Environment } from 'src/core/config/environment.enum';
import { AlertModule } from 'src/infra/alert/alert.module';
import { SweepNfseAlerts } from './application/usecases/sweep-nfse-alerts/sweep-nfse-alerts.service';
import { SweepNfseRecovery } from './application/usecases/sweep-nfse-recovery/sweep-nfse-recovery.service';
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
      ],
      providers: [
        SweepNfseAlerts,
        SweepNfseRecovery,
        ...(isTest ? [] : [NfseAlertsScheduler]),
      ],
      exports: [
        SweepNfseAlerts,
        SweepNfseRecovery,
      ],
    };
  }
}
