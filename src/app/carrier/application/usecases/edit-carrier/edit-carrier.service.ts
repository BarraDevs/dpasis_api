import { Inject, Injectable } from '@nestjs/common';
import { CarrierNotFoundError } from 'src/app/carrier/domain/errors/carrier-not-found.error';
import { CarrierFactory } from 'src/app/carrier/domain/factories/carrier.factory';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { DocumentAlreadyTakenError } from 'src/shared/errors/document-already-taken';
import type { ICarrierDao } from '../../persistence/dao/carrier-dao.interface';
import type { ICarrierRepository } from '../../persistence/repository/carrier-repository.interface';
import { EditCarrierInputDto } from './dtos/edit-carrier.dto';

@Injectable()
export class EditCarrier {
  constructor(
    @Inject(TOKENS.CarrierDao) private readonly carrierDao: ICarrierDao,
    @Inject(TOKENS.CarrierRepository) private readonly carrierRepository: ICarrierRepository,
  ) {}

  public async execute(id: number, data: EditCarrierInputDto): Promise<SuccessMessage> {
    const carrier = await this.carrierDao.findById(id);
    if (!carrier) {
      throw new CarrierNotFoundError();
    }

    const carrierEntity = CarrierFactory.edit({
      ...carrier,
      ...data,
      id,
      active: carrier.active,
    });

    if (data.document) {
      const documentAlreadyTaken = await this.carrierDao.findByDocument(
        carrierEntity.props.document,
      );
      if (documentAlreadyTaken && documentAlreadyTaken.id !== id) {
        throw new DocumentAlreadyTakenError(carrierEntity.props.document);
      }
    }

    await this.carrierRepository.edit(carrierEntity);

    return { message: 'Edição realizada com sucesso' };
  }
}
