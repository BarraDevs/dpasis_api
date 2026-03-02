import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientDepartmentNotFoundError } from '../../../domain/errors/client-department-not-found.error';
import type { IClientDepartmentDao } from '../../persistence/dao/client-department-dao.interface';

@Injectable()
export class DeleteClientDepartment {
  constructor(
    @Inject(TOKENS.ClientDepartmentDao) private readonly clientDepartmentDao: IClientDepartmentDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const clientDepartment = await this.clientDepartmentDao.findById(id);
    if (!clientDepartment) {
      throw new ClientDepartmentNotFoundError();
    }

    await this.clientDepartmentDao.delete(id);

    return { message: 'Departamento de clientes excluído com sucesso' };
  }
}
