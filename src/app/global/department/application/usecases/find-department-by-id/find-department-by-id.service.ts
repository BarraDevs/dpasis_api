import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { FindByIdOptions } from 'src/core/types/find-by-id-options.type';
import { DepartmentNotFoundError } from '../../../domain/errors/department-not-found.error';
import { DepartmentDto } from '../../dtos/department.dto';
import type { IDepartmentDao } from '../../persistence/dao/department-dao.interface';

@Injectable()
export class FindDepartmentById {
  constructor(
    @Inject(TOKENS.DepartmentDao) private readonly departmentDao: IDepartmentDao,
  ) {}

  public async execute(id: number, options: FindByIdOptions = {}): Promise<DepartmentDto> {
    const department = await this.departmentDao.findById(id);
    if (!department) {
      throw new DepartmentNotFoundError();
    }
    if (options.onlyActive && !department.active) {
      throw new DepartmentNotFoundError();
    }

    return department;
  }
}
