import { Inject, Injectable } from '@nestjs/common';
import { FindResaleDepartmentById } from 'src/app/resale/resale-department/application/usecases/find-resale-department-by-id/find-resale-department-by-id.service';
import { FindResaleById } from 'src/app/resale/resale/application/usecases/find-resale-by-id/find-resale-by-id.service';
import { TOKENS } from 'src/core/di/token';
import { ResaleContactAlreadyExistsError } from '../../../domain/errors/resale-contact-already-exists.error';
import { ResaleContactFactory } from '../../../domain/factories/resale-contact.factory';
import type { IResaleContactDao } from '../../persistence/dao/resale-contact-dao.interface';
import type { IResaleContactRepository } from '../../persistence/repository/resale-contact-repository.interface';
import { CreateResaleContactInputDto, CreateResaleContactOutputDto } from './dtos/create-resale-contact.dto';

@Injectable()
export class CreateResaleContact {
  constructor(
    @Inject(TOKENS.ResaleContactRepository) private readonly resaleContactRepository: IResaleContactRepository,
    @Inject(TOKENS.ResaleContactDao) private readonly resaleContactDao: IResaleContactDao,
    private readonly findResaleById: FindResaleById,
    private readonly findResaleDepartmentById: FindResaleDepartmentById,
  ) {}

  public async execute(data: CreateResaleContactInputDto): Promise<CreateResaleContactOutputDto> {
    const resale = await this.findResaleById.execute(data.resaleId, { onlyActive: true });
    const department = await this.findResaleDepartmentById.execute(data.departmentId, { onlyActive: true });

    const entity = ResaleContactFactory.create({
      resaleId: resale.id,
      departmentId: department.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      whatsapp: data.whatsapp,
      observations: data.observations,
      receiveNF: data.receiveNF,
    });

    const existing = await this.resaleContactDao.findByResaleIdAndEmail(resale.id, entity.props.email);
    if (existing) {
      throw new ResaleContactAlreadyExistsError(data.email);
    }

    const id = await this.resaleContactRepository.save(entity);

    return { id };
  }
}
