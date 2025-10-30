import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { AttachmentDto } from '../../dtos/attachment.dto';
import type { IAttachmentDao } from '../../persistence/dao/attachment-dao.interface';
import { FindAllAttachmentQueryDto } from './dtos/find-all-attachment.dto';

@Injectable()
export class FindAllAttachment {
  constructor(
    @Inject(TOKENS.AttachmentDao) private readonly attachmentDao: IAttachmentDao,
  ) {}

  public async execute(queries: FindAllAttachmentQueryDto): Promise<IPagination<AttachmentDto>> {
    const [result, total] = await this.attachmentDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
