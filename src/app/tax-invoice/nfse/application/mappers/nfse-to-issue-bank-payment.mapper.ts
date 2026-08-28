import { IssueBankPaymentInputDto } from 'src/app/bank-payment/application/usecases/issue-bank-payment/dtos/issue-bank-payment.dto';
import { InvoiceCalendarDueDate } from 'src/app/client/client-invoice-config/domain/value-objects/invoice-calendar-due-date/invoice-calendar-due-date.vo';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { AppException } from 'src/core/filters/app.exception';
import { BankPaymentPersonType } from 'src/infra/bank-payment/enums/bank-payment-person-type.enum';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import type { NfseBankPaymentSnapshot, NfseIssueSnapshot } from '../usecases/issue-nfse/issue-nfse.service';

export type NfseToIssueBankPaymentParams = {
  nfseId: number;
  issuedAt: Date;
  snapshot: NfseIssueSnapshot;
  bankPayment?: NfseBankPaymentSnapshot;
};

export class NfseToIssueBankPaymentMapper {
  private static readonly DAYS_AFTER_DUE = 30;

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
      yourNumber: String(params.nfseId).slice(0, 15),
      amount,
      dueDate: new InvoiceCalendarDueDate({
        ...bankPayment,
        issuedAt: params.issuedAt,
      }).value,
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

  private static resolvePersonType(clientType: string): BankPaymentPersonType {
    if (clientType === ClientType.PF) {
      return BankPaymentPersonType.INDIVIDUAL;
    }
    return BankPaymentPersonType.COMPANY;
  }
}
