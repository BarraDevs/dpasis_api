import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ResaleDepartmentAlreadyExistsError } from '../../../domain/errors/resale-department-already-exists.error';
import { ResaleDepartmentNotFoundError } from '../../../domain/errors/resale-department-not-found.error';
import type { IResaleDepartmentDao } from '../../persistence/dao/resale-department-dao.interface';
import { EditResaleDepartmentInputDto } from './dtos/edit-resale-department.dto';

@Injectable()
export class EditResaleDepartment {
  constructor(
    @Inject(TOKENS.ResaleDepartmentDao) private readonly resaleDepartmentDao: IResaleDepartmentDao,
  ) {}

  public async execute(id: number, data: EditResaleDepartmentInputDto): Promise<SuccessMessage> {
    const resaleDepartment = await this.resaleDepartmentDao.findById(id);
    if (!resaleDepartment) {
      throw new ResaleDepartmentNotFoundError();
    }

    const existing = await this.resaleDepartmentDao.findByName(data.name.trim());
    if (existing && existing.id !== id) {
      throw new ResaleDepartmentAlreadyExistsError(data.name);
    }

    await this.resaleDepartmentDao.edit(id, data);

    return { message: 'Departamento de revenda atualizado com sucesso' };
  }
}
