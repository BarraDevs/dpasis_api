import { Inject, Injectable } from '@nestjs/common';
import { FindCompanyNfsConfigByCompanyId } from 'src/app/company/company-nfs-config/application/usecases/find-company-nfs-config-by-company-id/find-company-nfs-config-by-company-id.service';
import { TOKENS } from 'src/core/di/token';
import { NfsProviderCredentialsDto, NfsProviderEnvironment } from 'src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';
import type { INfsGenerationGateway } from 'src/infra/nfs-generation/nfs-generation.gateway';
import { NfseNotFoundError } from '../../../domain/errors/nfse-not-found.error';
import type { INfseRepository } from '../../persistence/repository/nfse-repository.interface';
import type { NfseIssueSnapshot } from '../issue-nfse/issue-nfse.service';
import { CancelNfseInputDto, CancelNfseOutputDto } from './dtos/cancel-nfse.dto';

@Injectable()
export class CancelNfse {
  constructor(
    @Inject(TOKENS.NfseRepository) private readonly nfseRepository: INfseRepository,
    @Inject(TOKENS.NfsGenerationGateway) private readonly nfsGenerationGateway: INfsGenerationGateway,
    private readonly findCompanyNfsConfigByCompanyId: FindCompanyNfsConfigByCompanyId,
  ) {}

  public async execute(id: number, input: CancelNfseInputDto): Promise<CancelNfseOutputDto> {
    const nfse = await this.nfseRepository.findById(id);
    if (!nfse) {
      throw new NfseNotFoundError();
    }

    nfse.ensureCanCancel();

    const providerConfig = await this.findCompanyNfsConfigByCompanyId.execute(nfse.props.companyId);

    const snapshot = nfse.props.data as unknown as NfseIssueSnapshot;
    const provider: NfsProviderCredentialsDto = {
      certFilePath: providerConfig.certFilePath,
      certPasswordEnvVar: providerConfig.certPasswordEnvVar,
      environment: providerConfig.environment as NfsProviderEnvironment,
      vendorConfig: providerConfig.vendorConfig,
    };

    const result = await this.nfsGenerationGateway.cancelNfse({
      nfseNumber: nfse.props.nfseNumber!,
      providerDocument: snapshot.providerDocument,
      providerMunicipalCodeIbge: providerConfig.municipalCodeIbge,
      providerMunicipalRegistration: providerConfig.municipalRegistration,
      cancelReasonCode: input.cancelReasonCode,
      provider,
    });

    nfse.markCanceled(new Date(result.confirmedAt), input.cancelReasonCode);
    await this.nfseRepository.edit(nfse);

    return {
      id: nfse.props.id,
      status: nfse.props.status,
      canceledAt: nfse.props.canceledAt!,
    };
  }
}
