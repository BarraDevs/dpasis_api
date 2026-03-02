import { Inject, Injectable } from '@nestjs/common';
import { FindClientDepartmentById } from 'src/app/client/client-department/application/usecases/find-client-department-by-id/find-client-department-by-id.service';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Email } from 'src/shared/value-objects/email/email.vo';
import { Phone } from 'src/shared/value-objects/phone/phone.vo';
import { ClientContactAlreadyExistsError } from '../../../domain/errors/client-contact-already-exists.error';
import { ClientContactNotFoundError } from '../../../domain/errors/client-contact-not-found.error';
import type { IClientContactDao } from '../../persistence/dao/client-contact-dao.interface';
import { EditClientContactInputDto } from './dtos/edit-client-contact.dto';

@Injectable()
export class EditClientContact {
  constructor(
    @Inject(TOKENS.ClientContactDao) private readonly clientContactDao: IClientContactDao,
    private readonly findClientDepartmentById: FindClientDepartmentById,
  ) {}

  public async execute(id: number, data: EditClientContactInputDto): Promise<SuccessMessage> {
    const clientContact = await this.clientContactDao.findById(id);
    if (!clientContact) {
      throw new ClientContactNotFoundError();
    }

    if (data.departmentId) {
      await this.findClientDepartmentById.execute(data.departmentId, true);
    }

    let email = clientContact.email;
    if (data.email) {
      email = new Email(data.email).value;
      const existing = await this.clientContactDao.findByClientIdAndEmail(clientContact.clientId, email);
      if (existing && existing.id !== id) {
        throw new ClientContactAlreadyExistsError(data.email);
      }
    }

    let phone = clientContact.phone;
    let whatsapp = clientContact.whatsapp;
    if (data.phone) {
      phone = new Phone(data.phone).value;
    }
    if (data.whatsapp) {
      whatsapp = new Phone(data.whatsapp).value;
    }

    await this.clientContactDao.edit(id, {
      ...data,
      email,
      phone,
      whatsapp,
    });

    return { message: 'Contato de cliente atualizado com sucesso' };
  }
}
