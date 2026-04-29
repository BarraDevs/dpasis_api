import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { ResaleDepartmentAlreadyExistsError } from '../../../domain/errors/resale-department-already-exists.error';
import type { IResaleDepartmentDao } from '../../persistence/dao/resale-department-dao.interface';
import { CreateResaleDepartmentInputDto, CreateResaleDepartmentOutputDto } from './dtos/create-resale-department.dto';

@Injectable()
export class CreateResaleDepartment {
  constructor(
    @Inject(TOKENS.ResaleDepartmentDao) private readonly resaleDepartmentDao: IResaleDepartmentDao,
  ) {}

  public async execute(data: CreateResaleDepartmentInputDto): Promise<CreateResaleDepartmentOutputDto> {
    const existing = await this.resaleDepartmentDao.findByName(data.name.trim());
    if (existing) {
      throw new ResaleDepartmentAlreadyExistsError(data.name);
    }

    const id = await this.resaleDepartmentDao.save(data);
    return { id };
  }
}
