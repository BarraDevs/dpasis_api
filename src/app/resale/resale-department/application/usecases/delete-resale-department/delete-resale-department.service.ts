import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ResaleDepartmentInUseError } from '../../../domain/errors/resale-department-in-use.error';
import { ResaleDepartmentNotFoundError } from '../../../domain/errors/resale-department-not-found.error';
import type { IResaleDepartmentDao } from '../../persistence/dao/resale-department-dao.interface';

@Injectable()
export class DeleteResaleDepartment {
  constructor(
    @Inject(TOKENS.ResaleDepartmentDao) private readonly resaleDepartmentDao: IResaleDepartmentDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const resaleDepartment = await this.resaleDepartmentDao.findById(id);
    if (!resaleDepartment) {
      throw new ResaleDepartmentNotFoundError();
    }

    const contactsCount = await this.resaleDepartmentDao.countContactsByDepartmentId(id);
    if (contactsCount > 0) {
      throw new ResaleDepartmentInUseError();
    }

    await this.resaleDepartmentDao.delete(id);

    return { message: 'Departamento de revenda excluído com sucesso' };
  }
}
