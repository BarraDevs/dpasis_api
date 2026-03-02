import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { ClientDepartmentAlreadyExistsError } from '../../../domain/errors/client-department-already-exists.error';
import type { IClientDepartmentDao } from '../../persistence/dao/client-department-dao.interface';
import { CreateClientDepartmentInputDto, CreateClientDepartmentOutputDto } from './dtos/create-client-department.dto';

@Injectable()
export class CreateClientDepartment {
  constructor(
    @Inject(TOKENS.ClientDepartmentDao) private readonly clientDepartmentDao: IClientDepartmentDao,
  ) {}

  public async execute(data: CreateClientDepartmentInputDto): Promise<CreateClientDepartmentOutputDto> {
    const existing = await this.clientDepartmentDao.findByName(data.name.trim());
    if (existing) {
      throw new ClientDepartmentAlreadyExistsError(data.name);
    }

    const id = await this.clientDepartmentDao.save(data);
    return { id };
  }
}
