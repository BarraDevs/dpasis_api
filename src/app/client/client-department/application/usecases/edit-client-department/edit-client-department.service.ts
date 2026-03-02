import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientDepartmentAlreadyExistsError } from '../../../domain/errors/client-department-already-exists.error';
import { ClientDepartmentNotFoundError } from '../../../domain/errors/client-department-not-found.error';
import type { IClientDepartmentDao } from '../../persistence/dao/client-department-dao.interface';
import { EditClientDepartmentInputDto } from './dtos/edit-client-department.dto';

@Injectable()
export class EditClientDepartment {
  constructor(
    @Inject(TOKENS.ClientDepartmentDao) private readonly clientDepartmentDao: IClientDepartmentDao,
  ) {}

  public async execute(id: number, data: EditClientDepartmentInputDto): Promise<SuccessMessage> {
    const clientDepartment = await this.clientDepartmentDao.findById(id);
    if (!clientDepartment) {
      throw new ClientDepartmentNotFoundError();
    }

    const existing = await this.clientDepartmentDao.findByName(data.name.trim());
    if (existing && existing.id !== id) {
      throw new ClientDepartmentAlreadyExistsError(data.name);
    }

    await this.clientDepartmentDao.edit(id, data);

    return { message: 'Departamento de clientes atualizado com sucesso' };
  }
}
