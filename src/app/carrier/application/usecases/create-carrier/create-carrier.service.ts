import { Inject, Injectable } from '@nestjs/common';
import { CarrierFactory } from 'src/app/carrier/domain/factories/carrier.factory';
import { TOKENS } from 'src/core/di/token';
import { DocumentAlreadyTakenError } from 'src/shared/errors/document-already-taken';
import type { ICarrierDao } from '../../persistence/dao/carrier-dao.interface';
import type { ICarrierRepository } from '../../persistence/repository/carrier-repository.interface';
import { CreateCarrierInputDto, CreateCarrierOutputDto } from './dtos/create-carrier.dto';

@Injectable()
export class CreateCarrier {
  constructor(
    @Inject(TOKENS.CarrierDao) private readonly carrierDao: ICarrierDao,
    @Inject(TOKENS.CarrierRepository) private readonly carrierRepository: ICarrierRepository,
  ) {}

  public async execute(data: CreateCarrierInputDto): Promise<CreateCarrierOutputDto> {
    const entity = CarrierFactory.create(data);

    const documentAlreadyTaken = await this.carrierDao.findByDocument(entity.props.document);
    if (documentAlreadyTaken) {
      throw new DocumentAlreadyTakenError(entity.props.document);
    }

    const id = await this.carrierRepository.save(entity);

    return { id };
  }
}
