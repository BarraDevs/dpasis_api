import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { NfsProviderCredentialsDto, NfsProviderEnvironment } from 'src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';
import type { INfsGenerationGateway } from 'src/infra/nfs-generation/nfs-generation.gateway';
import { Nfse } from '../../../domain/entities/nfse.entity';
import { NfseStatus } from '../../../domain/enums/nfse-status.enum';
import { NfseAlreadyCanceledError } from '../../../domain/errors/nfse-already-canceled.error';
import { NfseNotFoundError } from '../../../domain/errors/nfse-not-found.error';
import { NfseNotIssuedError } from '../../../domain/errors/nfse-not-issued.error';
import { NfsProviderNotConfiguredError } from '../../../domain/errors/nfs-provider-not-configured.error';
import type { INfsProviderConfigDao } from '../../persistence/dao/nfs-provider-config-dao.interface';
import type { INfseDao } from '../../persistence/dao/nfse-dao.interface';
import type { NfseIssueSnapshot } from '../issue-nfse/issue-nfse.service';
import { CancelNfseInputDto, CancelNfseOutputDto } from './dtos/cancel-nfse.dto';

@Injectable()
export class CancelNfse {
  constructor(
    @Inject(TOKENS.NfseDao) private readonly nfseDao: INfseDao,
    @Inject(TOKENS.NfsProviderConfigDao) private readonly providerConfigDao: INfsProviderConfigDao,
    @Inject(TOKENS.NfsGenerationGateway) private readonly nfsGenerationGateway: INfsGenerationGateway,
  ) {}

  public async execute(id: number, input: CancelNfseInputDto): Promise<CancelNfseOutputDto> {
    const nfseDto = await this.nfseDao.findById(id);
    if (!nfseDto) {
      throw new NfseNotFoundError();
    }
    if (nfseDto.status === NfseStatus.CANCELED) {
      throw new NfseAlreadyCanceledError();
    }
    if (nfseDto.status !== NfseStatus.ISSUED) {
      throw new NfseNotIssuedError();
    }

    const providerConfig = await this.providerConfigDao.findByCompanyId(nfseDto.companyId);
    if (!providerConfig) {
      throw new NfsProviderNotConfiguredError();
    }

    const snapshot = nfseDto.data as unknown as NfseIssueSnapshot;
    const provider: NfsProviderCredentialsDto = {
      certFilePath: providerConfig.certFilePath,
      certPasswordEnvVar: providerConfig.certPasswordEnvVar,
      environment: providerConfig.environment as NfsProviderEnvironment,
      vendorConfig: providerConfig.vendorConfig,
    };

    const result = await this.nfsGenerationGateway.cancelNfse({
      nfseNumber: nfseDto.nfseNumber!,
      providerDocument: snapshot.providerDocument,
      providerMunicipalCodeIbge: providerConfig.municipalCodeIbge,
      providerMunicipalRegistration: providerConfig.municipalRegistration,
      cancelReasonCode: input.cancelReasonCode,
      provider,
    });

    const nfse = Nfse._instantiate(nfseDto);
    nfse.markCanceled(new Date(result.confirmedAt), input.cancelReasonCode);

    await this.nfseDao.updateStatus(nfse.props.id, {
      status: nfse.props.status,
      canceledAt: nfse.props.canceledAt ?? undefined,
      cancelReasonCode: nfse.props.cancelReasonCode ?? undefined,
    });

    return {
      id: nfse.props.id,
      status: nfse.props.status,
      canceledAt: nfse.props.canceledAt!,
    };
  }
}
