import { Inject, Injectable } from '@nestjs/common';
import { FindCompanyNfsConfigByCompanyId } from 'src/app/company/company-nfs-config/application/usecases/find-company-nfs-config-by-company-id/find-company-nfs-config-by-company-id.service';
import type { NfseIssueSnapshot } from 'src/app/tax-invoice/nfse/application/usecases/issue-nfse/issue-nfse.service';
import { TOKENS } from 'src/core/di/token';
import { NfsProviderCredentialsDto, NfsProviderEnvironment } from 'src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';
import type { INfsGenerationGateway } from 'src/infra/nfs-generation/nfs-generation.gateway';
import { NfmNotFoundError } from '../../../domain/errors/nfm-not-found.error';
import type { INfmRepository } from '../../persistence/repository/nfm-repository.interface';
import { FindNfmProviderStatusOutputDto } from './dtos/find-nfm-provider-status.dto';

@Injectable()
export class FindNfmProviderStatus {
  constructor(
    @Inject(TOKENS.NfmRepository) private readonly nfmRepository: INfmRepository,
    @Inject(TOKENS.NfsGenerationGateway) private readonly nfsGenerationGateway: INfsGenerationGateway,
    private readonly findCompanyNfsConfigByCompanyId: FindCompanyNfsConfigByCompanyId,
  ) {}

  /**
   * Pergunta ao provedor o que ele sabe sobre o RPS desta NFM, sem escrever nada. É o que o
   * operador roda antes de decidir — a resposta bruta fica registrada em `NfseAttempt` pelo adapter.
   */
  public async execute(nfmId: number): Promise<FindNfmProviderStatusOutputDto> {
    const nfm = await this.nfmRepository.findById(nfmId);
    if (!nfm) {
      throw new NfmNotFoundError();
    }

    nfm.ensureHasNfse();
    const nfse = nfm.props.nfse!;

    const providerConfig = await this.findCompanyNfsConfigByCompanyId.execute(nfse.props.companyId);
    const snapshot = nfse.props.data as unknown as NfseIssueSnapshot;

    const provider: NfsProviderCredentialsDto = {
      certFilePath: providerConfig.certFilePath,
      certPasswordEnvVar: providerConfig.certPasswordEnvVar,
      environment: providerConfig.environment as NfsProviderEnvironment,
      vendorConfig: providerConfig.vendorConfig,
    };

    const result = await this.nfsGenerationGateway.findNfseByRps({
      nfseId: nfse.props.id,
      rpsNumber: nfse.props.rpsNumber,
      rpsSeries: nfse.props.rpsSeries,
      providerDocument: snapshot.providerDocument,
      providerMunicipalRegistration: providerConfig.municipalRegistration,
      provider,
    });

    return {
      nfseId: nfse.props.id,
      rpsNumber: nfse.props.rpsNumber,
      rpsSeries: nfse.props.rpsSeries,
      found: result.found,
      note: result.note,
      errors: result.errors,
      consultedAt: new Date(),
    };
  }
}
