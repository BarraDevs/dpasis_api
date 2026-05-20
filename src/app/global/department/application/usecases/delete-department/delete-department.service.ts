import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { hasAnyPositiveReference } from 'src/shared/helpers/has-any-positive-reference';
import { DepartmentInUseError } from '../../../domain/errors/department-in-use.error';
import { DepartmentNotFoundError } from '../../../domain/errors/department-not-found.error';
import type { IDepartmentDao } from '../../persistence/dao/department-dao.interface';

@Injectable()
export class DeleteDepartment {
  constructor(
    @Inject(TOKENS.DepartmentDao) private readonly departmentDao: IDepartmentDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const department = await this.departmentDao.findById(id);
    if (!department) {
      throw new DepartmentNotFoundError();
    }

    const inUse = await hasAnyPositiveReference([
      () => this.departmentDao.countClientContactsByDepartmentId(id),
      () => this.departmentDao.countResaleContactsByDepartmentId(id),
    ]);
    if (inUse) {
      throw new DepartmentInUseError();
    }

    await this.departmentDao.delete(id);

    return { message: 'Departamento excluído com sucesso' };
  }
}
