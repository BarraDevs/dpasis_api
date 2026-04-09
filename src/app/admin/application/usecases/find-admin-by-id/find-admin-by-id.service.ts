import { Inject, Injectable } from '@nestjs/common';
import { AdminNotFoundError } from 'src/app/admin/domain/errors/admin-not-found.error';
import { AdminSubjectPermissionsVo } from 'src/app/admin/domain/value-objects/admin-subject-permissions/admin-subject-permissions.vo';
import { TOKENS } from 'src/core/di/token';
import { AdminWithSubjectsDto } from '../../dtos/admin.dto';
import type { IAdminDao } from '../../persistence/dao/admin-dao.interface';

@Injectable()
export class FindAdminById {
  constructor(
    @Inject(TOKENS.AdminDao) private readonly adminDao: IAdminDao,
  ) {}

  public async execute(id: number): Promise<AdminWithSubjectsDto> {
    const result = await this.adminDao.findByIdWithClaims(id);
    if (!result) {
      throw new AdminNotFoundError();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { claims, ...rest } = result;

    return {
      ...rest,
      subjects: AdminSubjectPermissionsVo.fromClaimValues(result.claims).toSubjects(),
    };
  }
}
