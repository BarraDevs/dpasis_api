import { CancelNfInputDto } from './dtos/cancel-nf.dto';
import { IssueCorrectionLetterInputDto } from './dtos/correction-letter.dto';
import { FindAllNfInvalidationsInputDto, FindAllNfInvalidationsOutputDto } from './dtos/find-all-invalidations.dto';
import { FindAllNfInputDto, FindAllNfOutputDto } from './dtos/find-all-nf.dto';
import { InvalidateNfNumbersInputDto, InvalidateNfNumbersOutputDto } from './dtos/invalidate-numbers.dto';
import { IssueNfInputDto, IssueNfOutputDto } from './dtos/issue-nf.dto';
import { NfFileDto } from './dtos/nf-file.dto';
import { NfDto } from './dtos/nf.dto';

export interface INfGenerationGateway {
  // notas fiscais
  findAll(query: FindAllNfInputDto): Promise<FindAllNfOutputDto>;
  findById(externalId: number): Promise<NfDto>;
  findByNumber(invoiceNumber: number): Promise<NfDto>;
  findByOrderCode(orderCode: string): Promise<NfDto>;
  findByDocument(document: string): Promise<NfDto[]>;
  issue(input: IssueNfInputDto): Promise<IssueNfOutputDto>;
  cancel(input: CancelNfInputDto): Promise<void>;

  // danfe
  getDanfe(accessKey: string): Promise<NfFileDto>;

  // arquivos xml
  getXml(accessKey: string): Promise<NfFileDto>;

  // danfes corrigidas
  issueCorrectionLetter(input: IssueCorrectionLetterInputDto): Promise<void>;
  getCorrectionLetterXml(accessKey: string): Promise<NfFileDto>;

  // inutilizadas
  invalidateNumbers(input: InvalidateNfNumbersInputDto): Promise<InvalidateNfNumbersOutputDto>;
  findAllInvalidations(query: FindAllNfInvalidationsInputDto): Promise<FindAllNfInvalidationsOutputDto>;
}
