import { Inject, Injectable } from '@nestjs/common';
import { FindClientAddressByClientIdAndType } from 'src/app/client/client-address/application/usecases/find-client-address-by-client-id-and-type/find-client-address-by-client-id-and-type.service';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { FindClientInvoiceConfigByClientId } from 'src/app/client/client-invoice-config/application/usecases/find-client-invoice-config-by-client-id/find-client-invoice-config-by-client-id.service';
import { FindClientById } from 'src/app/client/client/application/usecases/find-client-by-id/find-client-by-id.service';
import { FindCompanyNfsConfigByCompanyId } from 'src/app/company/company-nfs-config/application/usecases/find-company-nfs-config-by-company-id/find-company-nfs-config-by-company-id.service';
import { FindCompanyById } from 'src/app/company/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { SAO_PAULO_TIMEZONE } from 'src/core/constants/timezone.constant';
import { TOKENS } from 'src/core/di/token';
import { JobName } from 'src/infra/queue/enums/job-name.enum';
import { DateTime } from 'luxon';
import { ClientAddressForNfseNotFoundError } from '../../../domain/errors/client-address-for-nfse-not-found.error';
import { NfseStatus } from '../../../domain/enums/nfse-status.enum';
import { NfseFactory } from '../../../domain/factories/nfse.factory';
import type { INfseRepository } from '../../persistence/repository/nfse-repository.interface';
import type { INfseQueueProducer } from '../../queue/nfse-queue-producer.interface';
import { IssueNfseInputDto, IssueNfseOutputDto } from './dtos/issue-nfse.dto';

export type NfseBankPaymentSnapshot = {
  invoiceType: string;
  dueDateType: string;
  dueDateDay: number | null;
  dueMonth: number | null;
  deadlineDays: number | null;
  referenceMonth: number;
  referenceYear: number;
};

export type NfseIssueSnapshot = {
  input: IssueNfseInputDto;
  providerDocument: string;
  providerMunicipalRegistration: string;
  clientDocument: string;
  clientCompanyName: string;
  clientType: string;
  takerAddress?: {
    street: string;
    number: string;
    complement?: string | null;
    neighborhood: string;
    city: string;
    cityCodeIbge: string;
    state: string;
    zipCode: string;
  };
  bankPayment?: NfseBankPaymentSnapshot;
};

@Injectable()
export class IssueNfse {
  constructor(
    private readonly findCompanyById: FindCompanyById,
    private readonly findCompanyNfsConfigByCompanyId: FindCompanyNfsConfigByCompanyId,
    private readonly findClientById: FindClientById,
    private readonly findClientAddressByClientIdAndType: FindClientAddressByClientIdAndType,
    private readonly findClientInvoiceConfigByClientId: FindClientInvoiceConfigByClientId,
    @Inject(TOKENS.NfseRepository) private readonly nfseRepository: INfseRepository,
    @Inject(TOKENS.NfseQueueProducer) private readonly queueProducer: INfseQueueProducer,
  ) {}

  public async execute(input: IssueNfseInputDto): Promise<IssueNfseOutputDto> {
    const providerConfig = await this.findCompanyNfsConfigByCompanyId.execute(input.companyId);

    const [company, client, invoiceConfig] = await Promise.all([
      this.findCompanyById.execute(input.companyId),
      this.findClientById.execute(input.clientId),
      this.findClientInvoiceConfigByClientId.execute(input.clientId),
    ]);

    const billingAddress = await this.findClientAddressByClientIdAndType.execute(
      input.clientId,
      ClientAddressType.BILLING,
    );
    const mainAddress = billingAddress
      ? null
      : await this.findClientAddressByClientIdAndType.execute(input.clientId, ClientAddressType.MAIN);
    const takerAddressSource = billingAddress ?? mainAddress;

    if (!takerAddressSource?.cityCodeIbge?.trim()) {
      throw new ClientAddressForNfseNotFoundError();
    }

    const nowInSp = DateTime.now().setZone(SAO_PAULO_TIMEZONE);

    const snapshot: NfseIssueSnapshot = {
      input,
      providerDocument: company.document,
      providerMunicipalRegistration: providerConfig.municipalRegistration,
      clientDocument: client.document,
      clientCompanyName: client.companyName,
      clientType: client.type,
      takerAddress: {
        street: takerAddressSource.street,
        number: takerAddressSource.number,
        complement: takerAddressSource.complement,
        neighborhood: takerAddressSource.neighborhood,
        city: takerAddressSource.city,
        cityCodeIbge: takerAddressSource.cityCodeIbge,
        state: takerAddressSource.state,
        zipCode: takerAddressSource.zipCode,
      },
      bankPayment: {
        invoiceType: invoiceConfig.type,
        dueDateType: invoiceConfig.dueDateType,
        dueDateDay: invoiceConfig.dueDateDay,
        dueMonth: invoiceConfig.dueMonth,
        deadlineDays: invoiceConfig.deadlineDays,
        referenceMonth: nowInSp.month,
        referenceYear: nowInSp.year,
      },
    };

    const reservation = {
      companyId: input.companyId,
      clientId: input.clientId,
      rpsSeries: providerConfig.serieRps,
      data: snapshot as unknown as Record<string, unknown>,
    };
    NfseFactory.validateReservation(reservation);

    // Reserva do RPS, criação da NFS-e, vínculo com a NFM e registro no outbox acontecem numa
    // transação só. Antes eram três commits separados e o vínculo vinha por último: um crash no
    // meio deixava a NFM sem NFS-e vinculada e a execução seguinte emitia uma segunda nota.
    const { nfseId, outboxId } = await this.nfseRepository.reserve({
      ...reservation,
      nfmId: input.nfmId ?? null,
      jobName: JobName.IssueNfseBatch,
    });

    // Só depois do commit. Se o Redis estiver fora, a linha de outbox fica com `dispatchedAt` nulo
    // e o erro sobe — a NFS-e existe e é recuperável, em vez de existir e ser invisível.
    await this.queueProducer.addIssueBatchJob({ nfseId });
    await this.nfseRepository.markOutboxDispatched(outboxId);

    return { id: nfseId, status: NfseStatus.PENDING };
  }
}
