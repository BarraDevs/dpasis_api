import { Injectable, Inject } from '@nestjs/common';
import { FindCompanyById } from 'src/app/company/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { FindCompanyNfsConfigByCompanyId } from 'src/app/company/company-nfs-config/application/usecases/find-company-nfs-config-by-company-id/find-company-nfs-config-by-company-id.service';
import { TOKENS } from 'src/core/di/token';
import { NfsNoteDto } from 'src/infra/nfs-generation/dtos/find-nfs-servico-prestado.dto';
import { NfsProviderCredentialsDto, NfsProviderEnvironment } from 'src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';
import type { INfsGenerationGateway } from 'src/infra/nfs-generation/nfs-generation.gateway';
import { InvalidNfmInvoiceQueryError } from '../../../domain/errors/invalid-nfm-invoice-query.error';
import { FindAllNfmsQueryDto } from './dtos/find-all-nfms.dto';

@Injectable()
export class FindAllNfms {
  constructor(
    @Inject(TOKENS.NfsGenerationGateway) private readonly nfsGenerationGateway: INfsGenerationGateway,
    private readonly findCompanyById: FindCompanyById,
    private readonly findCompanyNfsConfigByCompanyId: FindCompanyNfsConfigByCompanyId,
  ) {}

  public async execute(queries: FindAllNfmsQueryDto): Promise<NfsNoteDto[]> {
    const hasPeriod = queries.dateFrom !== undefined && queries.dateTo !== undefined;
    const hasPartialPeriod = (queries.dateFrom !== undefined) !== (queries.dateTo !== undefined);
    const hasNfseNumber = queries.nfseNumber !== undefined && queries.nfseNumber !== '';

    if (hasPartialPeriod) {
      throw new InvalidNfmInvoiceQueryError('dateFrom e dateTo devem ser enviados juntos');
    }
    if (hasPeriod === hasNfseNumber) {
      throw new InvalidNfmInvoiceQueryError('Informe o período de emissão (dateFrom e dateTo) ou nfseNumber, exclusivamente');
    }

    const [company, providerConfig] = await Promise.all([
      this.findCompanyById.execute(queries.companyId),
      this.findCompanyNfsConfigByCompanyId.execute(queries.companyId),
    ]);

    const provider: NfsProviderCredentialsDto = {
      certFilePath: providerConfig.certFilePath,
      certPasswordEnvVar: providerConfig.certPasswordEnvVar,
      environment: providerConfig.environment as NfsProviderEnvironment,
      vendorConfig: providerConfig.vendorConfig,
    };

    return this.nfsGenerationGateway.findAllNFse({
      provider,
      providerDocument: company.document,
      providerMunicipalRegistration: providerConfig.municipalRegistration,
      page: queries.page ?? 1,
      periodFrom: hasPeriod ? queries.dateFrom : undefined,
      periodTo: hasPeriod ? queries.dateTo : undefined,
      nfseNumber: hasNfseNumber ? queries.nfseNumber : undefined,
      takerDocument: queries.recipientDocument,
    });
  }
}
