import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { ClientDescriptionTypeAlreadyExistsError } from '../../../domain/errors/client-description-type-already-exists.error';
import type { IClientDescriptionTypeDao } from '../../persistence/dao/client-description-type-dao.interface';
import { CreateClientDescriptionTypeInputDto, CreateClientDescriptionTypeOutputDto } from './dtos/create-client-description-type.dto';

@Injectable()
export class CreateClientDescriptionType {
  constructor(
    @Inject(TOKENS.ClientDescriptionTypeDao) private readonly clientDescriptionTypeDao: IClientDescriptionTypeDao,
  ) {}

  public async execute(data: CreateClientDescriptionTypeInputDto): Promise<CreateClientDescriptionTypeOutputDto> {
    const existing = await this.clientDescriptionTypeDao.findByName(data.name.trim());
    if (existing) {
      throw new ClientDescriptionTypeAlreadyExistsError(data.name);
    }

    const id = await this.clientDescriptionTypeDao.save(data);
    return { id };
  }
}
