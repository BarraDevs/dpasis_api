import { Inject, Injectable } from '@nestjs/common';
import { ResaleIdAlreadyTakenError } from 'src/app/resale/resale/domain/errors/resale-id-already-taken.error';
import { ResaleFactory } from 'src/app/resale/resale/domain/factories/resale.factory';
import { TOKENS } from 'src/core/di/token';
import { DocumentAlreadyTakenError } from 'src/shared/errors/document-already-taken';
import { Document as DocumentVo } from 'src/shared/value-objects/document/document.vo';
import type { IResaleDao } from '../../persistence/dao/resale-dao.interface';
import type { IResaleRepository } from '../../persistence/repository/resale-repository.interface';
import type { IResaleSequenceRepository } from '../../persistence/repository/resale-sequence-repository.interface';
import { CreateResaleInputDto, CreateResaleOutputDto } from './dtos/create-resale.dto';

@Injectable()
export class CreateResale {
  constructor(
    @Inject(TOKENS.ResaleDao) private readonly resaleDao: IResaleDao,
    @Inject(TOKENS.ResaleRepository) private readonly resaleRepository: IResaleRepository,
    @Inject(TOKENS.ResaleSequenceRepository) private readonly resaleSequenceRepository: IResaleSequenceRepository,
  ) {}

  public async execute(data: CreateResaleInputDto): Promise<CreateResaleOutputDto> {
    if (data.id != null) {
      const idAlreadyTaken = await this.resaleDao.findById(data.id);
      if (idAlreadyTaken) {
        throw new ResaleIdAlreadyTakenError(data.id);
      }
    }

    const normalizedDocument = new DocumentVo(data.document).value;
    const documentAlreadyTaken = await this.resaleDao.findByDocument(normalizedDocument);
    if (documentAlreadyTaken) {
      throw new DocumentAlreadyTakenError(normalizedDocument);
    }

    let resaleId: number;
    if (data.id != null) {
      resaleId = data.id;
      await this.resaleSequenceRepository.ensureNextIdIsAtLeast(resaleId + 1);
    }
    else {
      resaleId = await this.resaleSequenceRepository.getAndIncrement();
    }

    const entity = ResaleFactory.create({
      id: resaleId,
      name: data.name,
      identifier: data.identifier ?? null,
      zipCode: data.zipCode,
      street: data.street,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
      licenseType: data.licenseType,
      document: data.document,
      ie: data.ie ?? null,
      phone01: data.phone01,
      phone02: data.phone02 ?? null,
      voucher: data.voucher ?? null,
      email: data.email ?? null,
      website: data.website ?? null,
      receivesSupportEmail: data.receivesSupportEmail ?? false,
      servedByDpa: data.servedByDpa ?? false,
      manufacturerReseller: data.manufacturerReseller ?? false,
    });

    const id = await this.resaleRepository.save(entity);
    return { id };
  }
}
