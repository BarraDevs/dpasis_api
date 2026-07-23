import { Inject, Injectable } from '@nestjs/common';
import { FindClientById } from 'src/app/client/client/application/usecases/find-client-by-id/find-client-by-id.service';
import { FindCompanyById } from 'src/app/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { TOKENS } from 'src/core/di/token';
import { NfseStatus } from '../../../domain/enums/nfse-status.enum';
import { NfsProviderNotConfiguredError } from '../../../domain/errors/nfs-provider-not-configured.error';
import type { INfsProviderConfigDao } from '../../persistence/dao/nfs-provider-config-dao.interface';
import type { INfseDao } from '../../persistence/dao/nfse-dao.interface';
import type { INfseRpsSequenceRepository } from '../../persistence/repository/nfse-rps-sequence-repository.interface';
import type { INfseQueueProducer } from '../../queue/nfse-queue-producer.interface';
import { IssueNfseInputDto, IssueNfseOutputDto } from './dtos/issue-nfse.dto';

export type NfseIssueSnapshot = {
  input: IssueNfseInputDto;
  providerDocument: string;
  providerMunicipalRegistration: string;
  clientDocument: string;
  clientCompanyName: string;
};

@Injectable()
export class IssueNfse {
  constructor(
    @Inject(TOKENS.NfsProviderConfigDao) private readonly providerConfigDao: INfsProviderConfigDao,
    private readonly findCompanyById: FindCompanyById,
    private readonly findClientById: FindClientById,
    @Inject(TOKENS.NfseDao) private readonly nfseDao: INfseDao,
    @Inject(TOKENS.NfseRpsSequenceRepository) private readonly rpsSequenceRepository: INfseRpsSequenceRepository,
    @Inject(TOKENS.NfseQueueProducer) private readonly queueProducer: INfseQueueProducer,
  ) {}

  public async execute(input: IssueNfseInputDto): Promise<IssueNfseOutputDto> {
    const providerConfig = await this.providerConfigDao.findByCompanyId(input.companyId);
    if (!providerConfig) {
      throw new NfsProviderNotConfiguredError();
    }

    const [company, client] = await Promise.all([
      this.findCompanyById.execute(input.companyId),
      this.findClientById.execute(input.clientId),
    ]);

    const rpsNumber = await this.rpsSequenceRepository.getAndIncrement(input.companyId);

    const snapshot: NfseIssueSnapshot = {
      input,
      providerDocument: company.document,
      providerMunicipalRegistration: providerConfig.municipalRegistration,
      clientDocument: client.document,
      clientCompanyName: client.companyName,
    };

    const nfseId = await this.nfseDao.save({
      companyId: input.companyId,
      clientId: input.clientId,
      rpsNumber,
      rpsSeries: providerConfig.serieRps,
      data: snapshot as unknown as Record<string, unknown>,
    });

    await this.queueProducer.addIssueBatchJob({ nfseId });

    return { id: nfseId, status: NfseStatus.PENDING };
  }
}
