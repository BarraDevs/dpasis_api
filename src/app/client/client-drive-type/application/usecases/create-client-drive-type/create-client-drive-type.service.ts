import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { ClientDriveTypeAlreadyExistsError } from '../../../domain/errors/client-drive-type-already-exists.error';
import type { IClientDriveTypeDao } from '../../persistence/dao/client-drive-type-dao.interface';
import { CreateClientDriveTypeInputDto, CreateClientDriveTypeOutputDto } from './dtos/create-client-drive-type.dto';

@Injectable()
export class CreateClientDriveType {
  constructor(
    @Inject(TOKENS.ClientDriveTypeDao) private readonly clientDriveTypeDao: IClientDriveTypeDao,
  ) {}

  public async execute(data: CreateClientDriveTypeInputDto): Promise<CreateClientDriveTypeOutputDto> {
    const existing = await this.clientDriveTypeDao.findByName(data.name.trim());
    if (existing) {
      throw new ClientDriveTypeAlreadyExistsError(data.name);
    }

    const id = await this.clientDriveTypeDao.save(data);
    return { id };
  }
}
