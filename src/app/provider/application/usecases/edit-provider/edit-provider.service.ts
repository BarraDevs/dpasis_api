import { Inject, Injectable } from '@nestjs/common';
import { ProviderNotFoundError } from 'src/app/provider/domain/errors/provider-not-found.error';
import { ProviderFactory } from 'src/app/provider/domain/factories/provider.factory';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { DocumentAlreadyTakenError } from 'src/shared/errors/document-already-taken';
import { EmailAlreadyTakenError } from 'src/shared/errors/email-already-taken';
import type { IProviderDao } from '../../persistence/dao/provider-dao.interface';
import type { IProviderRepository } from '../../persistence/repository/provider-repository.interface';
import { EditProviderInputDto } from './dtos/edit-provider.dto';

@Injectable()
export class EditProvider {
  constructor(
    @Inject(TOKENS.ProviderDao) private readonly providerDao: IProviderDao,
    @Inject(TOKENS.ProviderRepository) private readonly providerRepository: IProviderRepository,
  ) {}

  public async execute(id: number, data: EditProviderInputDto): Promise<SuccessMessage> {
    const provider = await this.providerDao.findById(id);
    if (!provider) {
      throw new ProviderNotFoundError();
    }

    const providerEntity = ProviderFactory.edit({
      ...provider,
      ...data,
      id,
      active: provider.active,
    });

    if (data.document) {
      const documentAlreadyTaken = await this.providerDao.findByDocument(
        providerEntity.props.document,
      );
      if (documentAlreadyTaken && documentAlreadyTaken.id !== id) {
        throw new DocumentAlreadyTakenError(providerEntity.props.document);
      }
    }

    if (data.email) {
      const emailAlreadyTaken = await this.providerDao.findByEmail(providerEntity.props.email);
      if (emailAlreadyTaken && emailAlreadyTaken.id !== id) {
        throw new EmailAlreadyTakenError(data.email);
      }
    }

    await this.providerRepository.edit(providerEntity);

    return { message: 'Edição realizada com sucesso' };
  }
}
