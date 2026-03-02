import { Inject, Injectable } from '@nestjs/common';
import { FindClientDepartmentById } from 'src/app/client/client-department/application/usecases/find-client-department-by-id/find-client-department-by-id.service';
import { FindClientById } from 'src/app/client/client/application/usecases/find-client-by-id/find-client-by-id.service';
import { TOKENS } from 'src/core/di/token';
import { Email } from 'src/shared/value-objects/email/email.vo';
import { Phone } from 'src/shared/value-objects/phone/phone.vo';
import { ClientContactAlreadyExistsError } from '../../../domain/errors/client-contact-already-exists.error';
import type { IClientContactDao } from '../../persistence/dao/client-contact-dao.interface';
import { CreateClientContactInputDto, CreateClientContactOutputDto } from './dtos/create-client-contact.dto';

@Injectable()
export class CreateClientContact {
  constructor(
    @Inject(TOKENS.ClientContactDao) private readonly clientContactDao: IClientContactDao,
    private readonly findClientById: FindClientById,
    private readonly findClientDepartmentById: FindClientDepartmentById,
  ) {}

  public async execute(data: CreateClientContactInputDto): Promise<CreateClientContactOutputDto> {
    await this.findClientById.execute(data.clientId, true);
    await this.findClientDepartmentById.execute(data.departmentId, true);

    const email = new Email(data.email).value;

    const existing = await this.clientContactDao.findByClientIdAndEmail(data.clientId, email);
    if (existing) {
      throw new ClientContactAlreadyExistsError(data.email);
    }

    let phone: string | null = null;
    let whatsapp: string | null = null;
    if (data.phone?.trim()) {
      phone = new Phone(data.phone).value;
    }
    if (data.whatsapp?.trim()) {
      whatsapp = new Phone(data.whatsapp).value;
    }

    const id = await this.clientContactDao.save({
      ...data,
      email,
      phone,
      whatsapp,
    });

    return { id };
  }
}
