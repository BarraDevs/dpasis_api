import { Inject, Injectable } from '@nestjs/common';
import { FindDepartmentById } from 'src/app/global/department/application/usecases/find-department-by-id/find-department-by-id.service';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientContactAlreadyExistsError } from '../../../domain/errors/client-contact-already-exists.error';
import { ClientContactNotFoundError } from '../../../domain/errors/client-contact-not-found.error';
import { ClientContactFactory } from '../../../domain/factories/client-contact.factory';
import type { IClientContactDao } from '../../persistence/dao/client-contact-dao.interface';
import type { IClientContactRepository } from '../../persistence/repository/client-contact-repository.interface';
import { EditClientContactInputDto } from './dtos/edit-client-contact.dto';

@Injectable()
export class EditClientContact {
  constructor(
    @Inject(TOKENS.ClientContactRepository) private readonly clientContactRepository: IClientContactRepository,
    @Inject(TOKENS.ClientContactDao) private readonly clientContactDao: IClientContactDao,
    private readonly findDepartmentById: FindDepartmentById,
  ) {}

  public async execute(id: number, data: EditClientContactInputDto): Promise<SuccessMessage> {
    const clientContact = await this.clientContactRepository.findById(id);
    if (!clientContact) {
      throw new ClientContactNotFoundError();
    }

    if (data.departmentId) {
      await this.findDepartmentById.execute(data.departmentId, { onlyActive: true });
    }

    const updated = ClientContactFactory.edit(clientContact, {
      departmentId: data.departmentId ?? clientContact.props.departmentId,
      name: data.name ?? clientContact.props.name,
      email: data.email ?? clientContact.props.email,
      phone: data.phone ?? clientContact.props.phone,
      whatsapp: data.whatsapp ?? clientContact.props.whatsapp,
      observations: data.observations ?? clientContact.props.observations,
      receiveNF: data.receiveNF ?? clientContact.props.receiveNF,
    });

    if (data.email) {
      const existing = await this.clientContactDao.findByClientIdAndEmail(clientContact.props.clientId, updated.props.email);
      if (existing && existing.id !== id) {
        throw new ClientContactAlreadyExistsError(data.email);
      }
    }

    await this.clientContactRepository.edit(updated);

    return { message: 'Contato de cliente atualizado com sucesso' };
  }
}
