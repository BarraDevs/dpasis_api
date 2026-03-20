import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ServiceProposalValidityAlreadyExistsError } from '../../../domain/errors/service-proposal-validity-already-exists.error';
import { ServiceProposalValidityNotFoundError } from '../../../domain/errors/service-proposal-validity-not-found.error';
import type { IServiceProposalValidityDao } from '../../persistence/dao/service-proposal-validity-dao.interface';
import { EditServiceProposalValidityInputDto } from './dtos/edit-service-proposal-validity.dto';

@Injectable()
export class EditServiceProposalValidity {
  constructor(
    @Inject(TOKENS.ServiceProposalValidityDao) private readonly serviceProposalValidityDao: IServiceProposalValidityDao,
  ) {}

  public async execute(id: number, data: EditServiceProposalValidityInputDto): Promise<SuccessMessage> {
    const serviceProposalValidity = await this.serviceProposalValidityDao.findById(id);
    if (!serviceProposalValidity) {
      throw new ServiceProposalValidityNotFoundError();
    }

    const existing = await this.serviceProposalValidityDao.findByName(data.name.trim());
    if (existing && existing.id !== id) {
      throw new ServiceProposalValidityAlreadyExistsError(data.name);
    }

    await this.serviceProposalValidityDao.edit(id, data);

    return { message: 'Validade de proposta atualizada com sucesso' };
  }
}
