import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { ClientDepartmentNotFoundError } from '../../../domain/errors/client-department-not-found.error';
import { ClientDepartmentDto } from '../../dtos/client-department.dto';
import type { IClientDepartmentDao } from '../../persistence/dao/client-department-dao.interface';

@Injectable()
export class FindClientDepartmentById {
  constructor(
    @Inject(TOKENS.ClientDepartmentDao) private readonly clientDepartmentDao: IClientDepartmentDao,
  ) {}

  public async execute(id: number, onlyActive: boolean = false): Promise<ClientDepartmentDto> {
    const clientDepartment = await this.clientDepartmentDao.findById(id);
    if (!clientDepartment) {
      throw new ClientDepartmentNotFoundError();
    }
    if (onlyActive && !clientDepartment.active) {
      throw new ClientDepartmentNotFoundError();
    }

    return clientDepartment;
  }
}
