import { Inject, Injectable } from '@nestjs/common';
import { AdminNotFoundError } from 'src/app/admin/domain/errors/admin-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IAdminRepository } from '../../persistence/repository/admin-repository.interface';

@Injectable()
export class InactivateAdmin {
  constructor(
    @Inject(TOKENS.AdminRepository) private readonly adminRepository: IAdminRepository,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const admin = await this.adminRepository.findById(id);
    if (!admin) {
      throw new AdminNotFoundError();
    }

    admin.deactivate();
    await this.adminRepository.edit(admin);

    return { message: 'Administrador inativado com sucesso' };
  }
}
