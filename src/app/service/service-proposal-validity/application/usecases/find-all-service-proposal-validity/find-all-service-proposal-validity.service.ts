import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ServiceProposalValidityDto } from '../../dtos/service-proposal-validity.dto';
import type { IServiceProposalValidityDao } from '../../persistence/dao/service-proposal-validity-dao.interface';
import { FindAllServiceProposalValidityQueryDto } from './dtos/find-all-service-proposal-validity.dto';

@Injectable()
export class FindAllServiceProposalValidity {
  constructor(
    @Inject(TOKENS.ServiceProposalValidityDao) private readonly serviceProposalValidityDao: IServiceProposalValidityDao,
  ) {}

  public async execute(queries: FindAllServiceProposalValidityQueryDto): Promise<IPagination<ServiceProposalValidityDto>> {
    const [result, total] = await this.serviceProposalValidityDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
