import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { ClientSystemTypeAlreadyExistsError } from '../../../domain/errors/client-system-type-already-exists.error';
import type { IClientSystemTypeDao } from '../../persistence/dao/client-system-type-dao.interface';
import { CreateClientSystemTypeInputDto, CreateClientSystemTypeOutputDto } from './dtos/create-client-system-type.dto';

@Injectable()
export class CreateClientSystemType {
  constructor(
    @Inject(TOKENS.ClientSystemTypeDao) private readonly clientSystemTypeDao: IClientSystemTypeDao,
  ) {}

  public async execute(data: CreateClientSystemTypeInputDto): Promise<CreateClientSystemTypeOutputDto> {
    const existing = await this.clientSystemTypeDao.findByName(data.name.trim());
    if (existing) {
      throw new ClientSystemTypeAlreadyExistsError(data.name);
    }

    const id = await this.clientSystemTypeDao.save(data);
    return { id };
  }
}
