import { Inject, Injectable } from '@nestjs/common';
import { AdminFactory } from 'src/app/admin/domain/factories/admin.factory';
import { AdminSubjectPermissionsVo } from 'src/app/admin/domain/value-objects/admin-subject-permissions/admin-subject-permissions.vo';
import { TOKENS } from 'src/core/di/token';
import { DocumentAlreadyTakenError } from 'src/shared/errors/document-already-taken';
import { EmailAlreadyTakenError } from 'src/shared/errors/email-already-taken';
import { Password } from 'src/shared/value-objects/password/password.vo';
import type { IAdminDao } from '../../persistence/dao/admin-dao.interface';
import type { IAdminRepository } from '../../persistence/repository/admin-repository.interface';
import { CreateAdminInputDto, CreateAdminOutputDto } from './dtos/create-admin.dto';

@Injectable()
export class CreateAdmin {
  constructor(
    @Inject(TOKENS.AdminDao) private readonly adminDao: IAdminDao,
    @Inject(TOKENS.AdminRepository) private readonly adminRepository: IAdminRepository,
  ) {}

  public async execute(data: CreateAdminInputDto): Promise<CreateAdminOutputDto> {
    const claims = AdminSubjectPermissionsVo.fromInput(data.subjects).toClaims();

    const entity = AdminFactory.create({
      name: data.name,
      email: data.email,
      document: data.document,
      profilePicture: data.profilePicture ?? null,
      claims,
    });

    const emailTaken = await this.adminDao.findByEmail(entity.props.email);
    if (emailTaken) {
      throw new EmailAlreadyTakenError(data.email);
    }

    const documentTaken = await this.adminDao.findByDocument(entity.props.document);
    if (documentTaken) {
      throw new DocumentAlreadyTakenError(data.document);
    }

    const passwordHash = new Password(data.password).value;
    const id = await this.adminRepository.save(entity, passwordHash);

    return { id };
  }
}
