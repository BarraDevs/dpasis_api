import { Inject, Injectable } from '@nestjs/common';
import { RecordJobAudit } from 'src/app/audit/application/usecases/record-job-audit/record-job-audit.service';
import { NfseNotIssuedForBankPaymentError } from 'src/app/bank-payment/domain/errors/nfse-not-issued-for-bank-payment.error';
import { FindBankPayment } from 'src/app/bank-payment/application/usecases/find-bank-payment/find-bank-payment.service';
import { TOKENS } from 'src/core/di/token';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import { BankPaymentStatus } from 'src/infra/bank-payment/enums/bank-payment-status.enum';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { NfseBankPaymentNotLinkedError } from '../../../domain/errors/nfse-bank-payment-not-linked.error';
import { NfseBankPaymentNotReissuableError } from '../../../domain/errors/nfse-bank-payment-not-reissuable.error';
import { NfseNotFoundError } from '../../../domain/errors/nfse-not-found.error';
import type { INfseRepository } from '../../persistence/repository/nfse-repository.interface';
import type { INfseQueueProducer } from '../../queue/nfse-queue-producer.interface';
import { ReissueNfseBankPaymentInputDto, ReissueNfseBankPaymentOutputDto } from './dtos/reissue-nfse-bank-payment.dto';

@Injectable()
export class ReissueNfseBankPayment {
  constructor(
    @Inject(TOKENS.LoggerGateway) private readonly logger: ILoggerGateway,
    @Inject(TOKENS.NfseRepository) private readonly nfseRepository: INfseRepository,
    @Inject(TOKENS.NfseQueueProducer) private readonly queueProducer: INfseQueueProducer,
    private readonly findBankPayment: FindBankPayment,
    private readonly recordJobAudit: RecordJobAudit,
  ) {}

  /**
   * Reemite o boleto de uma NFS-e cuja cobrança o provedor não conseguiu produzir (`FALHA_EMISSAO`).
   *
   * A rota consulta o provedor ela mesma antes de decidir, como a reemissão da NFS-e: a confirmação
   * local pode estar atrasada, e desfazer o vínculo de uma cobrança viva é o caminho para o segundo
   * boleto. Confirmada a falha, o vínculo sai e o boleto volta para a fila de emissão.
   *
   * O `seuNumero` continua o id da NFS-e. Dentro da janela de 30 minutos o Inter ainda devolve a
   * chave da cobrança com falha; o job trata isso como transitório e a retentativa agendada espera a
   * janela passar. O payload é o mesmo da primeira emissão — pagador e endereço vêm do snapshot
   * congelado na NFS-e —, então reemitir resolve falha do lado do provedor, não cadastro corrigido.
   */
  public async execute(input: ReissueNfseBankPaymentInputDto): Promise<ReissueNfseBankPaymentOutputDto> {
    const nfse = await this.nfseRepository.findById(input.nfseId);
    if (!nfse) {
      throw new NfseNotFoundError();
    }
    // Antes de qualquer consulta: uma nota cancelada ainda carrega o código da cobrança, e reemitir
    // o boleto de uma nota cancelada é cobrar por um serviço que a própria operação desfez.
    if (!nfse.isIssued()) {
      throw new NfseNotIssuedForBankPaymentError();
    }

    const requestCode = nfse.props.bankPaymentRequestCode;
    if (!requestCode) {
      throw new NfseBankPaymentNotLinkedError();
    }

    const provider = (nfse.props.bankPaymentProvider ?? BankPaymentProvider.INTER) as BankPaymentProvider;
    const bankPayment = await this.findBankPayment.execute(requestCode, provider);
    if (bankPayment.status !== BankPaymentStatus.FAILED) {
      throw new NfseBankPaymentNotReissuableError(requestCode, bankPayment.status);
    }

    nfse.resetBankPaymentForReissue();
    await this.nfseRepository.edit(nfse);

    this.recordJobAudit.record({
      jobName: 'reissue-nfse-bank-payment',
      nfseId: nfse.props.id,
      from: BankPaymentStatus.FAILED,
      to: nfse.props.status,
      reason: `${input.reason} · cobrança ${requestCode} (${provider}) com falha de emissão desvinculada`,
    });

    this.logger.debug(LogContext.BANK_PAYMENT, {
      adapter: 'nfse',
      action: 'reissueNfseBankPayment',
      nfseId: nfse.props.id,
      requestCode,
    });

    // Depois do commit. Se o Redis estiver fora, a nota fica `ISSUED` sem cobrança e sem falha
    // registrada — exatamente o que `sweepMissingBankPayment` recoloca na fila em até cinco minutos.
    await this.queueProducer.addIssueBankPaymentJob({ nfseId: nfse.props.id });

    return { nfseId: nfse.props.id, replacedRequestCode: requestCode };
  }
}
