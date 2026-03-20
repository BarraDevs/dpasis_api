import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { FindByIdOptions } from 'src/core/types/find-by-id-options.type';
import { ServiceProposalValidityNotFoundError } from '../../../domain/errors/service-proposal-validity-not-found.error';
import { ServiceProposalValidityDto } from '../../dtos/service-proposal-validity.dto';
import type { IServiceProposalValidityDao } from '../../persistence/dao/service-proposal-validity-dao.interface';

@Injectable()
export class FindServiceProposalValidityById {
  constructor(
    @Inject(TOKENS.ServiceProposalValidityDao) private readonly serviceProposalValidityDao: IServiceProposalValidityDao,
  ) {}

  public async execute(id: number, options: FindByIdOptions = {}): Promise<ServiceProposalValidityDto> {
    const serviceProposalValidity = await this.serviceProposalValidityDao.findById(id);
    if (!serviceProposalValidity) {
      throw new ServiceProposalValidityNotFoundError();
    }
    if (options.onlyActive && !serviceProposalValidity.active) {
      throw new ServiceProposalValidityNotFoundError();
    }

    return serviceProposalValidity;
  }
}
