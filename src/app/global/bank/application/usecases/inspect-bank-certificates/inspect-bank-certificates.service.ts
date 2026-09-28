import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { IBankDao } from '../../persistence/dao/bank-dao.interface';
import { ResolveBankIntegrationCredentials } from '../resolve-bank-integration-credentials/resolve-bank-integration-credentials.service';
import { BankCertificateInspectionDto } from './dtos/inspect-bank-certificates.dto';

@Injectable()
export class InspectBankCertificates {
  constructor(
    @Inject(TOKENS.BankDao) private readonly dao: IBankDao,
    private readonly resolveBankIntegrationCredentials: ResolveBankIntegrationCredentials,
  ) {}

  public async execute(): Promise<BankCertificateInspectionDto[]> {
    const records = await this.dao.findAllWithCertificate();

    const inspections: BankCertificateInspectionDto[] = [];
    for (const record of records) {
      try {
        await this.resolveBankIntegrationCredentials.fromRecord(record);
        inspections.push({
          bankId: record.id,
          owner: `banco ${record.id} · ${record.drawer}`,
          path: record.certFilePath ?? `bank-payment/${record.id}`,
          notAfter: record.certificateNotAfter,
          loadError: null,
        });
      }
      catch (error: unknown) {
        inspections.push({
          bankId: record.id,
          owner: `banco ${record.id} · ${record.drawer}`,
          path: record.certFilePath ?? `bank-payment/${record.id}`,
          notAfter: record.certificateNotAfter,
          loadError: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return inspections;
  }
}
