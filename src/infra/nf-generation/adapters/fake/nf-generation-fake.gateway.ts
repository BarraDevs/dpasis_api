/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { CancelNfInputDto } from '../../dtos/cancel-nf.dto';
import { FindAllNfInputDto } from '../../dtos/find-all-nf.dto';
import { IssueNfInputDto, IssueNfOutputDto } from '../../dtos/issue-nf.dto';
import { NfFileDto } from '../../dtos/nf-file.dto';
import { NfDto } from '../../dtos/nf.dto';
import { INfGenerationGateway } from '../../nf-generation.gateway';

@Injectable()
export class NfGenerationFakeAdapterGateway implements INfGenerationGateway {
  findAll(_query: FindAllNfInputDto): Promise<NfDto[]> {
    throw new Error('Method not implemented.');
  }
  findById(_externalId: number): Promise<NfDto> {
    throw new Error('Method not implemented.');
  }
  issue(_input: IssueNfInputDto): Promise<IssueNfOutputDto> {
    throw new Error('Method not implemented.');
  }
  cancel(_input: CancelNfInputDto): Promise<void> {
    throw new Error('Method not implemented.');
  }
  getDanfe(_accessKey: string): Promise<NfFileDto> {
    throw new Error('Method not implemented.');
  }
  getXml(_accessKey: string): Promise<NfFileDto> {
    throw new Error('Method not implemented.');
  }
}
