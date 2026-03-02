import { Inject, Injectable } from '@nestjs/common';
import { FindClientDepartmentById } from 'src/app/client/client-department/application/usecases/find-client-department-by-id/find-client-department-by-id.service';
import { FindClientById } from 'src/app/client/client/application/usecases/find-client-by-id/find-client-by-id.service';
import { TOKENS } from 'src/core/di/token';
import { ClientContactAlreadyExistsError } from '../../../domain/errors/client-contact-already-exists.error';
import { ClientContactFactory } from '../../../domain/factories/client-contact.factory';
import type { IClientContactDao } from '../../persistence/dao/client-contact-dao.interface';
import type { IClientContactRepository } from '../../persistence/repository/client-contact-repository.interface';
import { CreateClientContactInputDto, CreateClientContactOutputDto } from './dtos/create-client-contact.dto';

@Injectable()
export class CreateClientContact {
  constructor(
    @Inject(TOKENS.ClientContactRepository) private readonly clientContactRepository: IClientContactRepository,
    @Inject(TOKENS.ClientContactDao) private readonly clientContactDao: IClientContactDao,
    private readonly findClientById: FindClientById,
    private readonly findClientDepartmentById: FindClientDepartmentById,
  ) {}

  public async execute(data: CreateClientContactInputDto): Promise<CreateClientContactOutputDto> {
    await this.findClientById.execute(data.clientId, true);
    await this.findClientDepartmentById.execute(data.departmentId, true);

    const entity = ClientContactFactory.create({
      clientId: data.clientId,
      departmentId: data.departmentId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      whatsapp: data.whatsapp,
      observations: data.observations,
      receiveNF: data.receiveNF,
    });

    const existing = await this.clientContactDao.findByClientIdAndEmail(data.clientId, entity.props.email);
    if (existing) {
      throw new ClientContactAlreadyExistsError(data.email);
    }

    const id = await this.clientContactRepository.save(entity);

    return { id };
  }
}
