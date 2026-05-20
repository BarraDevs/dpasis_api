import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { DepartmentNotFoundError } from '../../../domain/errors/department-not-found.error';
import type { IDepartmentDao } from '../../persistence/dao/department-dao.interface';

@Injectable()
export class UpdateDepartmentStatus {
  constructor(
    @Inject(TOKENS.DepartmentDao) private readonly departmentDao: IDepartmentDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const department = await this.departmentDao.findById(id);
    if (!department) {
      throw new DepartmentNotFoundError();
    }

    await this.departmentDao.updateStatus(id, !department.active);

    return { message: 'Status do departamento atualizado com sucesso' };
  }
}
