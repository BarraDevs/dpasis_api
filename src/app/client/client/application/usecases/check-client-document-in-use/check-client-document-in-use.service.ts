import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { Document as DocumentVo } from 'src/shared/value-objects/document/document.vo';
import type { IClientDao } from '../../persistence/dao/client-dao.interface';
import { CheckClientDocumentInUseInputDto, CheckClientDocumentInUseOutputDto } from './dtos/check-client-document-in-use.dto';

@Injectable()
export class CheckClientDocumentInUse {
  constructor(
    @Inject(TOKENS.ClientDao) private readonly clientDao: IClientDao,
  ) {}

  public async execute(data: CheckClientDocumentInUseInputDto): Promise<CheckClientDocumentInUseOutputDto> {
    const normalizedDocument = new DocumentVo(data.document).value;
    const existing = await this.clientDao.findByDocument(normalizedDocument);

    return { documentInUse: existing != null };
  }
}
