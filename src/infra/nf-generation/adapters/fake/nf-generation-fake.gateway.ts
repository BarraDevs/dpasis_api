import { Injectable } from '@nestjs/common';
import { ExternalApiError } from 'src/shared/errors/external-api.error';
import { CancelNfInputDto } from '../../dtos/cancel-nf.dto';
import { IssueCorrectionLetterInputDto } from '../../dtos/correction-letter.dto';
import { FindAllNfInvalidationsInputDto, FindAllNfInvalidationsOutputDto, NfInvalidationDto } from '../../dtos/find-all-invalidations.dto';
import { FindAllNfInputDto, FindAllNfOutputDto } from '../../dtos/find-all-nf.dto';
import { InvalidateNfNumbersInputDto, InvalidateNfNumbersOutputDto } from '../../dtos/invalidate-numbers.dto';
import { IssueNfInputDto, IssueNfOutputDto } from '../../dtos/issue-nf.dto';
import { NfFileDto } from '../../dtos/nf-file.dto';
import { NfDto } from '../../dtos/nf.dto';
import { NfProcessCode } from '../../enums/nf-process-code.enum';
import { INfGenerationGateway } from '../../nf-generation.gateway';

@Injectable()
export class NfGenerationFakeAdapterGateway implements INfGenerationGateway {
  private static nextExternalId = 1;

  private readonly nfStore = new Map<number, NfDto>();
  private readonly invalidationStore: NfInvalidationDto[] = [];

  public async findAll(query: FindAllNfInputDto): Promise<FindAllNfOutputDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    if (limit > 30) {
      throw new ExternalApiError('Limite máximo de 30 registros por página');
    }

    let rows = Array.from(this.nfStore.values());

    if (query.processCode !== undefined) {
      rows = rows.filter(row => row.processCode === query.processCode);
    }

    const total = rows.length;
    const start = (page - 1) * limit;
    const paginatedRows = rows.slice(start, start + limit);

    return {
      rows: paginatedRows,
      page,
      limit,
      total,
    };
  }

  public async findById(externalId: number): Promise<NfDto> {
    return this.getNfOrThrow(externalId);
  }

  public async findByNumber(invoiceNumber: number): Promise<NfDto> {
    const nf = Array.from(this.nfStore.values()).find(row => row.number === invoiceNumber);
    if (!nf) {
      throw new ExternalApiError('Nota fiscal não encontrada');
    }

    return nf;
  }

  public async findByOrderCode(orderCode: string): Promise<NfDto> {
    if (!orderCode?.trim()) {
      throw new ExternalApiError('Código do pedido é obrigatório');
    }

    const nf = Array.from(this.nfStore.values()).find(row => String(row.orderCode) === orderCode.trim());
    if (!nf) {
      throw new ExternalApiError('Nota fiscal não encontrada');
    }

    return nf;
  }

  public async findByDocument(document: string): Promise<NfDto[]> {
    const normalizedDocument = document.replace(/\D/g, '');
    if (!normalizedDocument) {
      throw new ExternalApiError('CPF/CNPJ é obrigatório');
    }

    const rows = Array.from(this.nfStore.values()).filter(row => row.recipientDocument === normalizedDocument);
    if (!rows.length) {
      throw new ExternalApiError('Nota fiscal não encontrada');
    }

    return rows;
  }

  public async issue(input: IssueNfInputDto): Promise<IssueNfOutputDto> {
    if (!input.content?.trim()) {
      throw new ExternalApiError('Conteúdo da nota fiscal é obrigatório');
    }

    const externalId = NfGenerationFakeAdapterGateway.nextExternalId++;
    const nf: NfDto = {
      externalId,
      rowId: externalId,
      number: null,
      orderCode: null,
      recipientDocument: '00000000000000',
      fantasyName: 'Cliente Fake',
      companyName: 'Cliente Fake LTDA',
      processCode: NfProcessCode.VALIDATED,
      processDescription: 'validada',
      accessKey: '35260112345678000199550010000001001000000010',
    };

    this.nfStore.set(externalId, nf);

    return {
      externalId,
      nf,
    };
  }

  public async cancel(input: CancelNfInputDto): Promise<void> {
    if (!input.reason?.trim() || input.reason.trim().length < 15) {
      throw new ExternalApiError('Motivo do cancelamento deve ter no mínimo 15 caracteres');
    }

    const nf = this.getNfOrThrow(input.externalId);
    this.nfStore.set(input.externalId, {
      ...nf,
      processCode: NfProcessCode.CANCELLED,
      processDescription: 'cancelada',
    });
  }

  public async getDanfe(accessKey: string): Promise<NfFileDto> {
    this.validateAccessKey(accessKey);

    return {
      content: Buffer.from('fake-pdf-content').toString('base64'),
      mimeType: 'application/pdf',
      fileName: `DANFe-${accessKey.replace(/\D/g, '')}.pdf`,
    };
  }

  public async getXml(accessKey: string): Promise<NfFileDto> {
    this.validateAccessKey(accessKey);

    return {
      content: '<NFe><infNFe Id="fake"/></NFe>',
      mimeType: 'application/xml',
      fileName: `NotaFiscal-${accessKey.replace(/\D/g, '')}.xml`,
    };
  }

  public async issueCorrectionLetter(input: IssueCorrectionLetterInputDto): Promise<void> {
    this.validateAccessKey(input.accessKey);
    const reason = input.reason?.trim() ?? '';

    if (reason.length < 15) {
      throw new ExternalApiError('Motivo da carta de correção deve ter no mínimo 15 caracteres');
    }

    if (reason.length > 1000) {
      throw new ExternalApiError('Motivo da carta de correção deve ter no máximo 1000 caracteres');
    }
  }

  public async getCorrectionLetterXml(accessKey: string): Promise<NfFileDto> {
    this.validateAccessKey(accessKey);

    return {
      content: '<CCe><infEvento Id="fake"/></CCe>',
      mimeType: 'application/xml',
      fileName: `CCe-${accessKey.replace(/\D/g, '')}.xml`,
    };
  }

  public async invalidateNumbers(input: InvalidateNfNumbersInputDto): Promise<InvalidateNfNumbersOutputDto> {
    const reason = input.reason?.trim() ?? '';

    if (reason.length < 15) {
      throw new ExternalApiError('Motivo da inutilização deve ter no mínimo 15 caracteres');
    }

    const invalidation: NfInvalidationDto = {
      environment: input.environment,
      year: input.year,
      series: input.series,
      startNumber: input.startNumber,
      endNumber: input.endNumber,
      reason,
    };

    const duplicate = this.invalidationStore.some(row =>
      row.environment === invalidation.environment
      && row.year === invalidation.year
      && row.series === invalidation.series
      && row.startNumber === invalidation.startNumber
      && row.endNumber === invalidation.endNumber,
    );

    if (duplicate) {
      return {
        code: 4,
        description: 'duplicidade',
      };
    }

    this.invalidationStore.push(invalidation);

    return {
      code: 0,
      description: 'retorno ok',
    };
  }

  public async findAllInvalidations(query: FindAllNfInvalidationsInputDto): Promise<FindAllNfInvalidationsOutputDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    if (limit > 30) {
      throw new ExternalApiError('Limite máximo de 30 registros por página');
    }

    const rows = this.invalidationStore.filter(row => row.year === query.year);
    const total = rows.length;
    const start = (page - 1) * limit;
    const paginatedRows = rows.slice(start, start + limit);

    return {
      rows: paginatedRows,
      page,
      limit,
      total,
    };
  }

  private getNfOrThrow(externalId: number): NfDto {
    const nf = this.nfStore.get(externalId);
    if (!nf) {
      throw new ExternalApiError('Nota fiscal não encontrada');
    }

    return nf;
  }

  private validateAccessKey(accessKey: string): void {
    const normalizedAccessKey = accessKey.replace(/\D/g, '');
    if (normalizedAccessKey.length !== 44) {
      throw new ExternalApiError('Chave de acesso deve conter 44 dígitos');
    }
  }
}
