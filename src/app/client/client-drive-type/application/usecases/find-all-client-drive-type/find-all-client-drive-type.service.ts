import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ClientDriveTypeDto } from '../../dtos/client-drive-type.dto';
import type { IClientDriveTypeDao } from '../../persistence/dao/client-drive-type-dao.interface';
import { FindAllClientDriveTypeQueryDto } from './dtos/find-all-client-drive-type.dto';

@Injectable()
export class FindAllClientDriveType {
  constructor(
    @Inject(TOKENS.ClientDriveTypeDao) private readonly clientDriveTypeDao: IClientDriveTypeDao,
  ) {}

  public async execute(queries: FindAllClientDriveTypeQueryDto): Promise<IPagination<ClientDriveTypeDto>> {
    const [result, total] = await this.clientDriveTypeDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
