import { Inject, Injectable } from '@nestjs/common';
import { FindCompanyById } from 'src/app/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ServiceDto } from '../../dtos/service.dto';
import type { IServiceDao } from '../../persistence/dao/service-dao.interface';
import { FindAllServiceQueryDto } from './dtos/find-all-service.dto';

@Injectable()
export class FindAllService {
  constructor(
    @Inject(TOKENS.ServiceDao) private readonly serviceDao: IServiceDao,
    private readonly findCompanyById: FindCompanyById,
  ) {}

  public async execute(queries: FindAllServiceQueryDto): Promise<IPagination<ServiceDto>> {
    const [result, total] = await this.serviceDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
