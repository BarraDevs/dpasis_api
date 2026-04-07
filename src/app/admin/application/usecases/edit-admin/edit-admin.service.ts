import { Inject, Injectable } from '@nestjs/common';
import { AdminNotFoundError } from 'src/app/admin/domain/errors/admin-not-found.error';
import { AdminFactory } from 'src/app/admin/domain/factories/admin.factory';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { DocumentAlreadyTakenError } from 'src/shared/errors/document-already-taken';
import { EmailAlreadyTakenError } from 'src/shared/errors/email-already-taken';
import type { IAdminDao } from '../../persistence/dao/admin-dao.interface';
import type { IAdminRepository } from '../../persistence/repository/admin-repository.interface';
import { EditAdminInputDto } from './dtos/edit-admin.dto';

@Injectable()
export class EditAdmin {
  constructor(
    @Inject(TOKENS.AdminDao) private readonly adminDao: IAdminDao,
    @Inject(TOKENS.AdminRepository) private readonly adminRepository: IAdminRepository,
  ) {}

  public async execute(id: number, data: EditAdminInputDto): Promise<SuccessMessage> {
    const existing = await this.adminRepository.findById(id);
    if (!existing) {
      throw new AdminNotFoundError();
    }

    const entity = AdminFactory.edit({
      accountId: id,
      name: data.name ?? existing.props.name,
      email: data.email ?? existing.props.email,
      document: data.document ?? existing.props.document,
      profilePicture: data.profilePicture !== undefined ? data.profilePicture : existing.props.profilePicture,
      status: existing.props.status,
      claims: data.claims,
    });

    if (data.email !== undefined) {
      const acc = await this.adminDao.findByEmail(entity.props.email);
      if (acc && acc.id !== id) {
        throw new EmailAlreadyTakenError(data.email);
      }
    }

    if (data.document !== undefined) {
      const documentTaken = await this.adminDao.findByDocument(entity.props.document);
      if (documentTaken && documentTaken.id !== id) {
        throw new DocumentAlreadyTakenError(entity.props.document);
      }
    }

    await this.adminRepository.edit(entity);

    return { message: 'Edição realizada com sucesso' };
  }
}
