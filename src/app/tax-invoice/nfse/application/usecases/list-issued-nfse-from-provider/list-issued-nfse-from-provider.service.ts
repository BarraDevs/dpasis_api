import { Inject, Injectable } from '@nestjs/common';
import { FindCompanyNfsConfigByCompanyId } from 'src/app/company/company-nfs-config/application/usecases/find-company-nfs-config-by-company-id/find-company-nfs-config-by-company-id.service';
import { FindCompanyById } from 'src/app/company/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { TOKENS } from 'src/core/di/token';
import { LIST_ISSUED_NFS_PAGE_SIZE } from 'src/infra/nfs-generation/dtos/list-issued-nfs.dto';
import { NfsProviderCredentialsDto, NfsProviderEnvironment } from 'src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';
import type { INfsGenerationGateway } from 'src/infra/nfs-generation/nfs-generation.gateway';
import { ExternalApiError } from 'src/shared/errors/external-api.error';
import { InvalidNfsePeriodError } from '../../../domain/errors/invalid-nfse-period.error';
import {
  ListIssuedNfseFromProviderOutputDto,
  ListIssuedNfseFromProviderQueryDto,
} from './dtos/list-issued-nfse-from-provider.dto';

@Injectable()
export class ListIssuedNfseFromProvider {
  constructor(
    @Inject(TOKENS.NfsGenerationGateway) private readonly nfsGenerationGateway: INfsGenerationGateway,
    private readonly findCompanyById: FindCompanyById,
    private readonly findCompanyNfsConfigByCompanyId: FindCompanyNfsConfigByCompanyId,
  ) {}

  /**
   * Lista NFS-e emitidas no Giss para uma empresa e um período. Uma chamada SOAP por request —
   * a paginação é a do provedor (50 notas). Não lê tabelas `nfm`/`nfse`.
   */
  public async execute(query: ListIssuedNfseFromProviderQueryDto): Promise<ListIssuedNfseFromProviderOutputDto> {
    if (query.startDate > query.endDate) {
      throw new InvalidNfsePeriodError();
    }

    const page = query.page ?? 1;
    const company = await this.findCompanyById.execute(query.companyId);
    const providerConfig = await this.findCompanyNfsConfigByCompanyId.execute(query.companyId);

    const provider: NfsProviderCredentialsDto = {
      certFilePath: providerConfig.certFilePath,
      certPasswordEnvVar: providerConfig.certPasswordEnvVar,
      environment: providerConfig.environment as NfsProviderEnvironment,
      vendorConfig: providerConfig.vendorConfig,
    };

    const result = await this.nfsGenerationGateway.listIssuedNfseByPeriod({
      startDate: query.startDate,
      endDate: query.endDate,
      page,
      providerDocument: company.document,
      providerMunicipalRegistration: providerConfig.municipalRegistration,
      provider,
    });

    if (result.errors?.length) {
      const detail = result.errors.map((error) => `${error.code}: ${error.message}`).join('; ');
      throw new ExternalApiError(`Erro ao consultar NFS-e por período no Giss: ${detail}`);
    }

    return {
      companyId: query.companyId,
      page,
      pageSize: LIST_ISSUED_NFS_PAGE_SIZE,
      endOfPages: result.endOfPages,
      notes: result.notes,
    };
  }
}
