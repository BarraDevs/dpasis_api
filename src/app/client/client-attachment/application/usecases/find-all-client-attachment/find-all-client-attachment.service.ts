import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ClientAttachmentDto } from '../../dtos/client-attachment.dto';
import type { IClientAttachmentDao } from '../../persistence/dao/client-attachment-dao.interface';
import { FindAllClientAttachmentQueryDto } from './dtos/find-all-client-attachment.dto';

@Injectable()
export class FindAllClientAttachment {
  constructor(
    @Inject(TOKENS.ClientAttachmentDao) private readonly clientAttachmentDao: IClientAttachmentDao,
  ) {}

  public async execute(queries: FindAllClientAttachmentQueryDto): Promise<IPagination<ClientAttachmentDto>> {
    const [result, total] = await this.clientAttachmentDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
