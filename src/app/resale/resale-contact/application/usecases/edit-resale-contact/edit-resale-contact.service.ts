import { Inject, Injectable } from '@nestjs/common';
import { FindResaleDepartmentById } from 'src/app/resale/resale-department/application/usecases/find-resale-department-by-id/find-resale-department-by-id.service';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ResaleContactAlreadyExistsError } from '../../../domain/errors/resale-contact-already-exists.error';
import { ResaleContactNotFoundError } from '../../../domain/errors/resale-contact-not-found.error';
import { ResaleContactFactory } from '../../../domain/factories/resale-contact.factory';
import type { IResaleContactDao } from '../../persistence/dao/resale-contact-dao.interface';
import type { IResaleContactRepository } from '../../persistence/repository/resale-contact-repository.interface';
import { EditResaleContactInputDto } from './dtos/edit-resale-contact.dto';

@Injectable()
export class EditResaleContact {
  constructor(
    @Inject(TOKENS.ResaleContactRepository) private readonly resaleContactRepository: IResaleContactRepository,
    @Inject(TOKENS.ResaleContactDao) private readonly resaleContactDao: IResaleContactDao,
    private readonly findResaleDepartmentById: FindResaleDepartmentById,
  ) {}

  public async execute(id: number, data: EditResaleContactInputDto): Promise<SuccessMessage> {
    const resaleContact = await this.resaleContactRepository.findById(id);
    if (!resaleContact) {
      throw new ResaleContactNotFoundError();
    }

    if (data.departmentId) {
      await this.findResaleDepartmentById.execute(data.departmentId, { onlyActive: true });
    }

    const updated = ResaleContactFactory.edit(resaleContact, {
      departmentId: data.departmentId ?? resaleContact.props.departmentId,
      name: data.name ?? resaleContact.props.name,
      email: data.email ?? resaleContact.props.email,
      phone: data.phone ?? resaleContact.props.phone,
      whatsapp: data.whatsapp ?? resaleContact.props.whatsapp,
      observations: data.observations ?? resaleContact.props.observations,
      receiveNF: data.receiveNF ?? resaleContact.props.receiveNF,
    });

    if (data.email) {
      const existing = await this.resaleContactDao.findByResaleIdAndEmail(resaleContact.props.resaleId, updated.props.email);
      if (existing && existing.id !== id) {
        throw new ResaleContactAlreadyExistsError(data.email);
      }
    }

    await this.resaleContactRepository.edit(updated);

    return { message: 'Contato de revenda atualizado com sucesso' };
  }
}
