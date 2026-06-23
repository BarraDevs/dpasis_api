import { Inject, Injectable } from '@nestjs/common';
import { ProviderFactory } from 'src/app/provider/domain/factories/provider.factory';
import { TOKENS } from 'src/core/di/token';
import { DocumentAlreadyTakenError } from 'src/shared/errors/document-already-taken';
import { EmailAlreadyTakenError } from 'src/shared/errors/email-already-taken';
import type { IProviderDao } from '../../persistence/dao/provider-dao.interface';
import type { IProviderRepository } from '../../persistence/repository/provider-repository.interface';
import { CreateProviderInputDto, CreateProviderOutputDto } from './dtos/create-provider.dto';

@Injectable()
export class CreateProvider {
  constructor(
    @Inject(TOKENS.ProviderDao) private readonly providerDao: IProviderDao,
    @Inject(TOKENS.ProviderRepository) private readonly providerRepository: IProviderRepository,
  ) {}

  public async execute(data: CreateProviderInputDto): Promise<CreateProviderOutputDto> {
    const entity = ProviderFactory.create({
      ...data,
      paymentDate: data.paymentDate ?? null,
      deadline: data.deadline ?? null,
    });

    const documentAlreadyTaken = await this.providerDao.findByDocument(entity.props.document);
    if (documentAlreadyTaken) {
      throw new DocumentAlreadyTakenError(entity.props.document);
    }

    const emailAlreadyTaken = await this.providerDao.findByEmail(entity.props.email);
    if (emailAlreadyTaken) {
      throw new EmailAlreadyTakenError(data.email);
    }

    const id = await this.providerRepository.save(entity);

    return { id };
  }
}
