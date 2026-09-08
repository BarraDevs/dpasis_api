import { DateTime } from 'luxon';
import { IssueBankPaymentInputDto } from 'src/app/bank-payment/application/usecases/issue-bank-payment/dtos/issue-bank-payment.dto';
import { InvoiceCalendarDueDate } from 'src/app/client/client-invoice-config/domain/value-objects/invoice-calendar-due-date/invoice-calendar-due-date.vo';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { AppException } from 'src/core/filters/app.exception';
import { BankPaymentPersonType } from 'src/infra/bank-payment/enums/bank-payment-person-type.enum';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import { SAO_PAULO_TIMEZONE } from 'src/core/constants/timezone.constant';
import type { NfseBankPaymentSnapshot, NfseIssueSnapshot } from '../usecases/issue-nfse/issue-nfse.service';

export type NfseToIssueBankPaymentParams = {
  nfseId: number;
  issuedAt: Date;
  snapshot: NfseIssueSnapshot;
  bankPayment?: NfseBankPaymentSnapshot;
};

export class NfseToIssueBankPaymentMapper {
  private static readonly DAYS_AFTER_DUE = 30;

  /** O Inter só aceita vencimento no próprio dia até 19h59. */
  private static readonly SAME_DAY_CUTOFF_HOUR = 19;
  private static readonly SAME_DAY_CUTOFF_MINUTE = 59;

  public static toIssueBankPaymentInput(params: NfseToIssueBankPaymentParams): IssueBankPaymentInputDto {
    const bankPayment = params.bankPayment ?? params.snapshot.bankPayment;
    if (!bankPayment) {
      throw new AppException('Contexto de boleto ausente na NFS-e.');
    }

    const amount = params.snapshot.input?.service?.servicesValue;
    if (typeof amount !== 'number' || !(amount > 0)) {
      throw new AppException('Valor dos serviços inválido para emissão do boleto.');
    }

    const takerAddress = params.snapshot.takerAddress;
    if (!takerAddress?.city?.trim()) {
      throw new AppException('Cidade do tomador ausente para emissão do boleto.');
    }

    return {
      provider: BankPaymentProvider.INTER,
      nfseId: params.nfseId,
      yourNumber: String(params.nfseId).slice(0, 15),
      amount,
      dueDate: this.applyDueDateFloor(
        new InvoiceCalendarDueDate({
          ...bankPayment,
          issuedAt: params.issuedAt,
        }).value,
        params.issuedAt,
      ),
      daysAfterDue: this.DAYS_AFTER_DUE,
      payer: {
        document: params.snapshot.clientDocument,
        personType: this.resolvePersonType(params.snapshot.clientType),
        name: params.snapshot.clientCompanyName,
        street: takerAddress.street,
        number: takerAddress.number,
        complement: takerAddress.complement ?? undefined,
        neighborhood: takerAddress.neighborhood,
        city: takerAddress.city,
        state: takerAddress.state,
        zipCode: takerAddress.zipCode?.replace(/\D/g, '').slice(0, 8),
      },
    };
  }

  /**
   * Vencimento fixo é calculado a partir da competência, não da emissão: um contrato de vencimento
   * dia 15 faturado no dia 20 produz uma data no passado, que o Inter recusa com 4xx — e a NFS-e fica
   * emitida sem cobrança. Com o faturamento diário alcançando dias já vencidos (`dueDateDay <= hoje`),
   * isso deixa de ser exceção.
   *
   * O piso vem de `issuedAt`, **nunca** de `new Date()`: o payload do boleto precisa ser idêntico em
   * toda retentativa, senão a chave implícita de 30 minutos do Inter deixa de valer e a retentativa
   * vira uma segunda cobrança.
   */
  private static applyDueDateFloor(dueDate: string, issuedAt: Date): string {
    const issued = DateTime.fromJSDate(issuedAt, { zone: SAO_PAULO_TIMEZONE });
    const afterCutoff = issued.hour > this.SAME_DAY_CUTOFF_HOUR
      || (issued.hour === this.SAME_DAY_CUTOFF_HOUR && issued.minute > this.SAME_DAY_CUTOFF_MINUTE);
    const floor = afterCutoff ? issued.plus({ days: 1 }) : issued;
    const floorDate = floor.toFormat('yyyy-MM-dd');

    return dueDate < floorDate ? floorDate : dueDate;
  }

  private static resolvePersonType(clientType: string): BankPaymentPersonType {
    if (clientType === ClientType.PF) {
      return BankPaymentPersonType.INDIVIDUAL;
    }
    return BankPaymentPersonType.COMPANY;
  }
}
