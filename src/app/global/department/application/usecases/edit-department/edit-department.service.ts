import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { DepartmentAlreadyExistsError } from '../../../domain/errors/department-already-exists.error';
import { DepartmentNotFoundError } from '../../../domain/errors/department-not-found.error';
import type { IDepartmentDao } from '../../persistence/dao/department-dao.interface';
import { EditDepartmentInputDto } from './dtos/edit-department.dto';

@Injectable()
export class EditDepartment {
  constructor(
    @Inject(TOKENS.DepartmentDao) private readonly departmentDao: IDepartmentDao,
  ) {}

  public async execute(id: number, data: EditDepartmentInputDto): Promise<SuccessMessage> {
    const department = await this.departmentDao.findById(id);
    if (!department) {
      throw new DepartmentNotFoundError();
    }

    const existing = await this.departmentDao.findByName(data.name.trim());
    if (existing && existing.id !== id) {
      throw new DepartmentAlreadyExistsError(data.name);
    }

    await this.departmentDao.edit(id, data);

    return { message: 'Edição realizada com sucesso' };
  }
}
