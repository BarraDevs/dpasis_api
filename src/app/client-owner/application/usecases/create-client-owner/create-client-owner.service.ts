import { Inject, Injectable } from '@nestjs/common';
import { ClientOwnerAlreadyExistsError } from 'src/app/client-owner/domain/errors/client-owner-already-exists.error';
import { TOKENS } from 'src/core/di/token';
import type { IClientOwnerDao } from '../../persistence/dao/client-owner-dao.interface';
import { CreateClientOwnerInputDto, CreateClientOwnerOutputDto } from './dtos/create-client-owner.dto';

@Injectable()
export class CreateClientOwner {
  constructor(
    @Inject(TOKENS.ClientOwnerDao) private readonly clientOwnerDao: IClientOwnerDao,
  ) {}

  public async execute(data: CreateClientOwnerInputDto): Promise<CreateClientOwnerOutputDto> {
    const existing = await this.clientOwnerDao.findByName(data.name.trim());
    if (existing) {
      throw new ClientOwnerAlreadyExistsError(data.name);
    }

    const id = await this.clientOwnerDao.save(data);
    return { id };
  }
}
