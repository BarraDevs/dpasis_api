import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ClientInvoiceConfigDto } from '../../dtos/client-invoice-config.dto';
import type { IClientInvoiceConfigDao } from '../../persistence/dao/client-invoice-config-dao.interface';
import { FindAllClientInvoiceConfigQueryDto } from './dtos/find-all-client-invoice-config.dto';

@Injectable()
export class FindAllClientInvoiceConfig {
  constructor(
    @Inject(TOKENS.ClientInvoiceConfigDao) private readonly clientInvoiceConfigDao: IClientInvoiceConfigDao,
  ) {}

  public async execute(queries: FindAllClientInvoiceConfigQueryDto): Promise<IPagination<ClientInvoiceConfigDto>> {
    const [result, total] = await this.clientInvoiceConfigDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
