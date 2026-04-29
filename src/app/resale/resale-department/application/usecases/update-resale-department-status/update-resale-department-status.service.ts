import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ResaleDepartmentNotFoundError } from '../../../domain/errors/resale-department-not-found.error';
import type { IResaleDepartmentDao } from '../../persistence/dao/resale-department-dao.interface';

@Injectable()
export class UpdateResaleDepartmentStatus {
  constructor(
    @Inject(TOKENS.ResaleDepartmentDao) private readonly resaleDepartmentDao: IResaleDepartmentDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const resaleDepartment = await this.resaleDepartmentDao.findById(id);
    if (!resaleDepartment) {
      throw new ResaleDepartmentNotFoundError();
    }

    await this.resaleDepartmentDao.updateStatus(id, !resaleDepartment.active);

    return { message: 'Status do departamento de revenda atualizado com sucesso' };
  }
}
