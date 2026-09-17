import { BankPaymentDto } from '../../../dtos/bank-payment.dto';
import { BankPaymentPayerDto } from '../../../dtos/bank-payment-payer.dto';
import { BankPaymentPdfDto } from '../../../dtos/bank-payment-pdf.dto';
import { CancelBankPaymentInputDto } from '../../../dtos/cancel-bank-payment.dto';
import { IssueBankPaymentInputDto } from '../../../dtos/issue-bank-payment.dto';
import { ListBankPaymentInputDto, ListBankPaymentOutputDto } from '../../../dtos/list-bank-payment.dto';
import { BankPaymentPersonType } from '../../../enums/bank-payment-person-type.enum';
import { BankPaymentProvider } from '../../../enums/bank-payment-provider.enum';
import { BankPaymentStatus } from '../../../enums/bank-payment-status.enum';
import { BankPaymentRequestError } from '../../../errors/bank-payment-request.error';
import type {
  InterCancelarCobrancaRequestDto,
  InterCobrancaDetalheDto,
  InterCobrancaListItemDto,
  InterCobrancaListResponseDto,
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
  ATRASADO: BankPaymentStatus.EMITTED,
  Aguardando: BankPaymentStatus.AWAITING_APPROVAL,
  AGUARDANDO_APROVACAO: BankPaymentStatus.AWAITING_APPROVAL,
  PAGO: BankPaymentStatus.PAID,
  CANCELADO: BankPaymentStatus.CANCELLED,
  EXPIRADO: BankPaymentStatus.EXPIRED,
  MARCADO_RECEBIDO: BankPaymentStatus.MARKED_RECEIVED,
  FALHA: BankPaymentStatus.FAILED,
  FALHA_EMISSAO: BankPaymentStatus.FAILED,
};

const STATUS_TO_INTER: Partial<Record<BankPaymentStatus, string>> = {
  [BankPaymentStatus.RECEIVED]: 'RECEBIDO',
  [BankPaymentStatus.EMITTED]: 'A_RECEBER',
  [BankPaymentStatus.MARKED_RECEIVED]: 'MARCADO_RECEBIDO',
  [BankPaymentStatus.CANCELLED]: 'CANCELADO',
  [BankPaymentStatus.EXPIRED]: 'EXPIRADO',
  [BankPaymentStatus.FAILED]: 'FALHA_EMISSAO',
};

export class InterCobrancaMapper {
  public static toIssueRequest(input: IssueBankPaymentInputDto): InterEmitirCobrancaRequestDto {
    const request: InterEmitirCobrancaRequestDto = {
      seuNumero: input.yourNumber,
      valorNominal: input.amount,
      dataVencimento: input.dueDate,
      numDiasAgenda: input.daysAfterDue,
      pagador: this.toInterPayer(input.payer),
    };

    if (input.fineRate != null) {
      request.multa = {
        codigo: 'PERCENTUAL',
        taxa: input.fineRate,
      };
    }

    if (input.moraRate != null) {
      request.mora = {
        codigo: 'TAXAMENSAL',
        taxa: input.moraRate,
      };
    }

    return request;
  }

  public static toCancelRequest(input: CancelBankPaymentInputDto): InterCancelarCobrancaRequestDto {
    return {
      motivoCancelamento: input.reason,
    };
  }

  public static toListQueryParams(input: ListBankPaymentInputDto): Record<string, string | number> {
    const page = input.page ?? 1;
    const size = input.size ?? 100;
    const params: Record<string, string | number> = {
      dataInicial: input.startDate,
      dataFinal: input.endDate,
      'paginacao.paginaAtual': page - 1,
      'paginacao.itensPorPagina': size,
    };

    if (input.status) {
      const situacao = STATUS_TO_INTER[input.status];
      if (!situacao) {
        throw new BankPaymentRequestError('Situação não suportada na listagem.');
      }
      params.situacao = situacao;
    }

    if (input.yourNumber?.trim()) {
      params.seuNumero = input.yourNumber.trim();
    }

    if (input.payerName?.trim()) {
      params.pessoaPagadora = input.payerName.trim();
    }

    if (input.payerDocument?.trim()) {
      params.cpfCnpjPessoaPagadora = input.payerDocument.trim();
    }

    return params;
  }

  public static toListOutput(data: InterCobrancaListResponseDto): ListBankPaymentOutputDto {
    const items = (data.cobrancas ?? []).map((item) => this.toBankPaymentDtoFromListItem(item));
    return {
      items,
      total: data.totalElementos ?? 0,
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

  private static toBankPaymentDtoFromListItem(item: InterCobrancaListItemDto): BankPaymentDto {
    if (item.cobranca) {
      return this.toBankPaymentDto(item.cobranca.codigoSolicitacao ?? '', item);
    }

    // Flat list item: fields at root + optional boleto/pix
    return this.toBankPaymentDto(item.codigoSolicitacao ?? '', {
      cobranca: {
        codigoSolicitacao: item.codigoSolicitacao,
        seuNumero: item.seuNumero,
        dataEmissao: item.dataEmissao,
        dataVencimento: item.dataVencimento,
        valorNominal: item.valorNominal,
        tipoCobranca: item.tipoCobranca,
        situacao: item.situacao,
        dataSituacao: item.dataSituacao,
        valorTotalRecebido: item.valorTotalRecebido,
        origemRecebimento: item.origemRecebimento,
        arquivada: item.arquivada,
        numDiasAgenda: item.numDiasAgenda,
        descontos: item.descontos,
        multa: item.multa,
        mora: item.mora,
        pagador: item.pagador,
      },
      boleto: item.boleto,
      pix: item.pix,
      notaFiscal: item.notaFiscal,
    });
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
