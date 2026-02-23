import { Inject, Injectable } from '@nestjs/common';
import { ClientGroupAlreadyExistsError } from 'src/app/client-group/domain/errors/client-group-already-exists.error';
import { TOKENS } from 'src/core/di/token';
import type { IClientGroupDao } from '../../persistence/dao/client-group-dao.interface';
import { CreateClientGroupInputDto, CreateClientGroupOutputDto } from './dtos/create-client-group.dto';

@Injectable()
export class CreateClientGroup {
  constructor(
    @Inject(TOKENS.ClientGroupDao) private readonly clientGroupDao: IClientGroupDao,
  ) {}

  public async execute(data: CreateClientGroupInputDto): Promise<CreateClientGroupOutputDto> {
    const existing = await this.clientGroupDao.findByName(data.name.trim());
    if (existing) {
      throw new ClientGroupAlreadyExistsError(data.name);
    }

    const id = await this.clientGroupDao.save(data);
    return { id };
  }
}
