import { CancelNfInputDto } from './dtos/cancel-nf.dto';
import { FindAllNfInputDto } from './dtos/find-all-nf.dto';
import { IssueNfInputDto, IssueNfOutputDto } from './dtos/issue-nf.dto';
import { NfFileDto } from './dtos/nf-file.dto';
import { NfDto } from './dtos/nf.dto';

export interface INfGenerationGateway {
  // notas fiscais
  findAll(query: FindAllNfInputDto): Promise<NfDto[]>;
  findById(externalId: number): Promise<NfDto>;
  issue(input: IssueNfInputDto): Promise<IssueNfOutputDto>;
  cancel(input: CancelNfInputDto): Promise<void>;

  // danfe
  getDanfe(accessKey: string): Promise<NfFileDto>;

  // arquivos xml
  getXml(accessKey: string): Promise<NfFileDto>;
}
