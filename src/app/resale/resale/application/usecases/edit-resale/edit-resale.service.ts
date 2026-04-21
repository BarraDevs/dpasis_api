import { Inject, Injectable } from '@nestjs/common';
import { ResaleNotFoundError } from 'src/app/resale/resale/domain/errors/resale-not-found.error';
import { ResaleFactory } from 'src/app/resale/resale/domain/factories/resale.factory';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { DocumentAlreadyTakenError } from 'src/shared/errors/document-already-taken';
import { Document as DocumentVo } from 'src/shared/value-objects/document/document.vo';
import type { IResaleDao } from '../../persistence/dao/resale-dao.interface';
import type { IResaleRepository } from '../../persistence/repository/resale-repository.interface';
import { EditResaleInputDto } from './dtos/edit-resale.dto';

@Injectable()
export class EditResale {
  constructor(
    @Inject(TOKENS.ResaleDao) private readonly resaleDao: IResaleDao,
    @Inject(TOKENS.ResaleRepository) private readonly resaleRepository: IResaleRepository,
  ) {}

  public async execute(id: number, data: EditResaleInputDto): Promise<SuccessMessage> {
    const resale = await this.resaleDao.findById(id);
    if (!resale) {
      throw new ResaleNotFoundError();
    }

    const resaleEntity = ResaleFactory.edit({
      id,
      name: data.name ?? resale.name,
      identifier: data.identifier !== undefined ? data.identifier : resale.identifier,
      zipCode: data.zipCode ?? resale.zipCode,
      street: data.street ?? resale.street,
      neighborhood: data.neighborhood ?? resale.neighborhood,
      city: data.city ?? resale.city,
      state: data.state ?? resale.state,
      licenseType: data.licenseType ?? resale.licenseType,
      document: data.document ?? resale.document,
      ie: data.ie !== undefined ? data.ie : resale.ie,
      phone01: data.phone01 ?? resale.phone01,
      phone02: data.phone02 !== undefined ? data.phone02 : resale.phone02,
      voucher: data.voucher !== undefined ? data.voucher : resale.voucher,
      email: data.email !== undefined ? data.email : resale.email,
      website: data.website !== undefined ? data.website : resale.website,
      receivesSupportEmail: data.receivesSupportEmail ?? resale.receivesSupportEmail,
      servedByDpa: data.servedByDpa ?? resale.servedByDpa,
      manufacturerReseller: data.manufacturerReseller ?? resale.manufacturerReseller,
      active: resale.active,
    });

    if (data.document) {
      const normalizedDocument = new DocumentVo(data.document).value;
      const documentAlreadyTaken = await this.resaleDao.findByDocument(normalizedDocument);
      if (documentAlreadyTaken && documentAlreadyTaken.id !== id) {
        throw new DocumentAlreadyTakenError(normalizedDocument);
      }
    }

    await this.resaleRepository.edit(resaleEntity);

    return { message: 'Edição realizada com sucesso' };
  }
}
