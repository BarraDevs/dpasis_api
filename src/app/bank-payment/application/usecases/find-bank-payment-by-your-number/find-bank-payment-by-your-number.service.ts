import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { IBankPaymentGateway } from 'src/infra/bank-payment/bank-payment.gateway';
import { BankPaymentDto } from 'src/infra/bank-payment/dtos/bank-payment.dto';
import { BankPaymentStatus } from 'src/infra/bank-payment/enums/bank-payment-status.enum';
import { FindBankPaymentByYourNumberInputDto } from './dtos/find-bank-payment-by-your-number.dto';

/**
 * Uma cobrança cancelada não conta como existente: ela não cobra ninguém e reemitir é o
 * comportamento certo. As demais situações — inclusive `FAILED`/`FALHA_EMISSAO` — significam que o
 * provedor já conhece esta chave, e emitir de novo é o que produz o segundo boleto.
 */
const NON_BLOCKING_STATUSES: BankPaymentStatus[] = [BankPaymentStatus.CANCELLED];

@Injectable()
export class FindBankPaymentByYourNumber {
  constructor(
    @Inject(TOKENS.BankPaymentGateway) private readonly bankPaymentGateway: IBankPaymentGateway,
  ) {}

  /**
   * Consulta o provedor pela chave natural da cobrança. É o que protege o caminho de conserto —
   * retry manual, reprocessamento de DLQ, retomada de fila —, que sempre acontece fora da janela
   * de idempotência implícita de 30 minutos do Inter e, sem esta consulta, duplica o boleto.
   *
   * `dataInicial`/`dataFinal` são obrigatórios na API e filtram por vencimento: usa-se a data de
   * vencimento que está prestes a ser enviada, que é congelada entre tentativas.
   */
  public async execute(input: FindBankPaymentByYourNumberInputDto): Promise<BankPaymentDto | null> {
    const result = await this.bankPaymentGateway.list({
      provider: input.provider,
      startDate: input.dueDate,
      endDate: input.dueDate,
      yourNumber: input.yourNumber,
      page: 1,
      size: 100,
    });

    const match = result.items.find((item) => (
      item.yourNumber === input.yourNumber
      && item.amount === input.amount
      && item.dueDate === input.dueDate
      && !NON_BLOCKING_STATUSES.includes(item.status)
    ));

    return match ?? null;
  }
}
