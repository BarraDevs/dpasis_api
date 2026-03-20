import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { ServiceProposalValidityAlreadyExistsError } from '../../../domain/errors/service-proposal-validity-already-exists.error';
import type { IServiceProposalValidityDao } from '../../persistence/dao/service-proposal-validity-dao.interface';
import { CreateServiceProposalValidityInputDto, CreateServiceProposalValidityOutputDto } from './dtos/create-service-proposal-validity.dto';

@Injectable()
export class CreateServiceProposalValidity {
  constructor(
    @Inject(TOKENS.ServiceProposalValidityDao) private readonly serviceProposalValidityDao: IServiceProposalValidityDao,
  ) {}

  public async execute(data: CreateServiceProposalValidityInputDto): Promise<CreateServiceProposalValidityOutputDto> {
    const existing = await this.serviceProposalValidityDao.findByName(data.name.trim());
    if (existing) {
      throw new ServiceProposalValidityAlreadyExistsError(data.name);
    }

    const id = await this.serviceProposalValidityDao.save(data);
    return { id };
  }
}
