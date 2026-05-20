import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DepartmentAlreadyExistsError } from '../../../domain/errors/department-already-exists.error';
import type { IDepartmentDao } from '../../persistence/dao/department-dao.interface';
import { CreateDepartmentInputDto, CreateDepartmentOutputDto } from './dtos/create-department.dto';

@Injectable()
export class CreateDepartment {
  constructor(
    @Inject(TOKENS.DepartmentDao) private readonly departmentDao: IDepartmentDao,
  ) {}

  public async execute(data: CreateDepartmentInputDto): Promise<CreateDepartmentOutputDto> {
    const existing = await this.departmentDao.findByName(data.name.trim());
    if (existing) {
      throw new DepartmentAlreadyExistsError(data.name);
    }

    const id = await this.departmentDao.save(data);
    return { id };
  }
}
