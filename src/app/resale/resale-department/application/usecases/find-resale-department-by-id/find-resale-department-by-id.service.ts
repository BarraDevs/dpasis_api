import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { FindByIdOptions } from 'src/core/types/find-by-id-options.type';
import { ResaleDepartmentNotFoundError } from '../../../domain/errors/resale-department-not-found.error';
import { ResaleDepartmentDto } from '../../dtos/resale-department.dto';
import type { IResaleDepartmentDao } from '../../persistence/dao/resale-department-dao.interface';

@Injectable()
export class FindResaleDepartmentById {
  constructor(
    @Inject(TOKENS.ResaleDepartmentDao) private readonly resaleDepartmentDao: IResaleDepartmentDao,
  ) {}

  public async execute(id: number, options: FindByIdOptions = {}): Promise<ResaleDepartmentDto> {
    const resaleDepartment = await this.resaleDepartmentDao.findById(id);
    if (!resaleDepartment) {
      throw new ResaleDepartmentNotFoundError();
    }
    if (options.onlyActive && !resaleDepartment.active) {
      throw new ResaleDepartmentNotFoundError();
    }

    return resaleDepartment;
  }
}
