import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ProposalValidityDto } from '../../dtos/proposal-validity.dto';
import type { IProposalValidityDao } from '../../persistence/dao/proposal-validity-dao.interface';
import { FindAllProposalValidityQueryDto } from './dtos/find-all-proposal-validity.dto';

@Injectable()
export class FindAllProposalValidity {
  constructor(
    @Inject(TOKENS.ProposalValidityDao) private readonly proposalValidityDao: IProposalValidityDao,
  ) {}

  public async execute(queries: FindAllProposalValidityQueryDto): Promise<IPagination<ProposalValidityDto>> {
    const [result, total] = await this.proposalValidityDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
