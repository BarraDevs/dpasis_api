import { Inject, Injectable } from '@nestjs/common';
import { AdminNotFoundError } from 'src/app/admin/domain/errors/admin-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { AdminDetailDto } from '../../dtos/admin.dto';
import type { IAdminDao } from '../../persistence/dao/admin-dao.interface';

@Injectable()
export class FindAdminById {
  constructor(
    @Inject(TOKENS.AdminDao) private readonly adminDao: IAdminDao,
  ) {}

  public async execute(id: number): Promise<AdminDetailDto> {
    const result = await this.adminDao.findByIdWithClaims(id);
    if (!result) {
      throw new AdminNotFoundError();
    }

    return result;
  }
}
