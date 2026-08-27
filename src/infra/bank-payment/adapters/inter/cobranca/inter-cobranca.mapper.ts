import { BankPaymentDto } from '../../../dtos/bank-payment.dto';
import { BankPaymentPayerDto } from '../../../dtos/bank-payment-payer.dto';
import { BankPaymentPdfDto } from '../../../dtos/bank-payment-pdf.dto';
import { CancelBankPaymentInputDto } from '../../../dtos/cancel-bank-payment.dto';
import { IssueBankPaymentInputDto } from '../../../dtos/issue-bank-payment.dto';
import { BankPaymentPersonType } from '../../../enums/bank-payment-person-type.enum';
import { BankPaymentProvider } from '../../../enums/bank-payment-provider.enum';
import { BankPaymentStatus } from '../../../enums/bank-payment-status.enum';
import type {
  InterCancelarCobrancaRequestDto,
  InterCobrancaDetalheDto,
  InterCobrancaPdfResponseDto,
  InterEmitirCobrancaRequestDto,
  InterPagadorDto,
  InterTipoPessoa,
} from './dtos/inter-cobranca.dto';

const PERSON_TYPE_TO_INTER: Record<BankPaymentPersonType, InterTipoPessoa> = {
  [BankPaymentPersonType.INDIVIDUAL]: 'FISICA',
  [BankPaymentPersonType.COMPANY]: 'JURIDICA',
};

const PERSON_TYPE_FROM_INTER: Record<InterTipoPessoa, BankPaymentPersonType> = {
  FISICA: BankPaymentPersonType.INDIVIDUAL,
  JURIDICA: BankPaymentPersonType.COMPANY,
};

const STATUS_FROM_INTER: Record<string, BankPaymentStatus> = {
  RECEBIDO: BankPaymentStatus.RECEIVED,
  A_RECEBER: BankPaymentStatus.EMITTED,
  EMABERTO: BankPaymentStatus.EMITTED,
  EMISSAO: BankPaymentStatus.EMITTED,
  Aguardando: BankPaymentStatus.AWAITING_APPROVAL,
  AGUARDANDO_APROVACAO: BankPaymentStatus.AWAITING_APPROVAL,
  PAGO: BankPaymentStatus.PAID,
  CANCELADO: BankPaymentStatus.CANCELLED,
  EXPIRADO: BankPaymentStatus.EXPIRED,
  MARCADO_RECEBIDO: BankPaymentStatus.MARKED_RECEIVED,
  FALHA: BankPaymentStatus.FAILED,
  FALHA_EMISSAO: BankPaymentStatus.FAILED,
};

export class InterCobrancaMapper {
  public static toIssueRequest(input: IssueBankPaymentInputDto): InterEmitirCobrancaRequestDto {
    return {
      seuNumero: input.yourNumber,
      valorNominal: input.amount,
      dataVencimento: input.dueDate,
      numDiasAgenda: input.daysAfterDue,
      pagador: this.toInterPayer(input.payer),
    };
  }

  public static toCancelRequest(input: CancelBankPaymentInputDto): InterCancelarCobrancaRequestDto {
    return {
      motivoCancelamento: input.reason,
    };
  }

  public static toBankPaymentDto(requestCode: string, data: InterCobrancaDetalheDto): BankPaymentDto {
    const cobranca = data.cobranca;
    const payer = this.fromInterPayer(cobranca?.pagador);

    return {
      provider: BankPaymentProvider.INTER,
      requestCode: cobranca?.codigoSolicitacao ?? requestCode,
      yourNumber: cobranca?.seuNumero ?? '',
      status: this.mapStatus(cobranca?.situacao),
      amount: cobranca?.valorNominal ?? 0,
      dueDate: cobranca?.dataVencimento ?? '',
      daysAfterDue: cobranca?.numDiasAgenda,
      payer,
      boleto: data.boleto
        ? {
          ourNumber: data.boleto.nossoNumero,
          barcode: data.boleto.codigoBarras,
          digitableLine: data.boleto.linhaDigitavel,
        }
        : undefined,
      pix: data.pix
        ? {
          txid: data.pix.txid,
          copyAndPaste: data.pix.pixCopiaECola,
        }
        : undefined,
    };
  }

  public static toPdfDto(requestCode: string, data: InterCobrancaPdfResponseDto): BankPaymentPdfDto {
    return {
      provider: BankPaymentProvider.INTER,
      requestCode,
      pdf: data.pdf ?? '',
    };
  }

  private static toInterPayer(payer: IssueBankPaymentInputDto['payer']): InterPagadorDto {
    return {
      email: payer.email,
      ddd: payer.areaCode,
      telefone: payer.phone,
      cpfCnpj: payer.document,
      tipoPessoa: PERSON_TYPE_TO_INTER[payer.personType],
      nome: payer.name,
      endereco: payer.street,
      numero: payer.number,
      complemento: payer.complement,
      bairro: payer.neighborhood,
      cidade: payer.city,
      uf: payer.state,
      cep: payer.zipCode,
    };
  }

  private static fromInterPayer(pagador?: InterPagadorDto): BankPaymentPayerDto {
    if (!pagador) {
      return {
        document: '',
        personType: BankPaymentPersonType.INDIVIDUAL,
        name: '',
      };
    }

    return {
      email: pagador.email,
      areaCode: pagador.ddd,
      phone: pagador.telefone,
      document: pagador.cpfCnpj,
      personType: PERSON_TYPE_FROM_INTER[pagador.tipoPessoa] ?? BankPaymentPersonType.INDIVIDUAL,
      name: pagador.nome,
      street: pagador.endereco,
      number: pagador.numero,
      complement: pagador.complemento,
      neighborhood: pagador.bairro,
      city: pagador.cidade,
      state: pagador.uf,
      zipCode: pagador.cep,
    };
  }

  private static mapStatus(situacao?: string): BankPaymentStatus {
    if (!situacao) {
      return BankPaymentStatus.UNKNOWN;
    }
    return STATUS_FROM_INTER[situacao] ?? BankPaymentStatus.UNKNOWN;
  }
}
