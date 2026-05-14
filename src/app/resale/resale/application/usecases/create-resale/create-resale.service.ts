import { Inject, Injectable } from '@nestjs/common';
import { FindHonorificById } from 'src/app/honorific/application/usecases/find-honorific-by-id/find-honorific-by-id.service';
import { UploadSingle } from 'src/app/upload-file/application/usecases/upload-single/upload-single.service';
import { ResaleExplicitIdInvalidError } from 'src/app/resale/resale/domain/errors/resale-explicit-id-invalid.error';
import { ResaleIdAlreadyTakenError } from 'src/app/resale/resale/domain/errors/resale-id-already-taken.error';
import { ResaleProfilePictureFolder } from 'src/app/resale/resale/domain/value-objects/resale-profile-picture-folder.vo';
import { ResaleFactory } from 'src/app/resale/resale/domain/factories/resale.factory';
import { TOKENS } from 'src/core/di/token';
import { DocumentAlreadyTakenError } from 'src/shared/errors/document-already-taken';
import { Document as DocumentVo } from 'src/shared/value-objects/document/document.vo';
import type { IResaleDao } from '../../persistence/dao/resale-dao.interface';
import type { IResaleRepository } from '../../persistence/repository/resale-repository.interface';
import type { IResaleSequenceRepository } from '../../persistence/repository/resale-sequence-repository.interface';
import { CreateResaleExecuteInputDto, CreateResaleOutputDto } from './dtos/create-resale.dto';

@Injectable()
export class CreateResale {
  constructor(
    @Inject(TOKENS.ResaleDao) private readonly resaleDao: IResaleDao,
    @Inject(TOKENS.ResaleRepository) private readonly resaleRepository: IResaleRepository,
    @Inject(TOKENS.ResaleSequenceRepository) private readonly resaleSequenceRepository: IResaleSequenceRepository,
    private readonly uploadSingle: UploadSingle,
    private readonly findHonorificById: FindHonorificById,
  ) {}

  public async execute(data: CreateResaleExecuteInputDto, file?: Express.Multer.File): Promise<CreateResaleOutputDto> {
    if (data.id != null && data.id < 1) {
      throw new ResaleExplicitIdInvalidError();
    }

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

    if (data.honorificId != null) {
      await this.findHonorificById.execute(data.honorificId, { onlyActive: true });
    }

    let resaleId: number;
    if (data.id != null) {
      resaleId = data.id;
      await this.resaleSequenceRepository.ensureNextIdIsAtLeast(resaleId + 1);
    }
    else {
      resaleId = await this.resaleSequenceRepository.getAndIncrement();
    }

    let profilePictureUrl: string | null = null;

    if (file) {
      const folder = new ResaleProfilePictureFolder(resaleId);
      const upload = await this.uploadSingle.execute(file, folder.value);
      profilePictureUrl = upload.url;
    }

    const entity = ResaleFactory.create({
      id: resaleId,
      type: data.type,
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
      nickname: data.nickname ?? null,
      socialName: data.socialName ?? null,
      validityDate: data.validityDate ? new Date(data.validityDate) : null,
      accessEmail: data.accessEmail ?? null,
      accessPassword: data.accessPassword ?? null,
      paymentDay: data.paymentDay ?? null,
      bonus: data.bonus ?? null,
      billingStartDay: data.billingStartDay ?? null,
      receivesSupportEmail: data.receivesSupportEmail ?? false,
      servedByRoot: data.servedByRoot ?? false,
      manufacturerResale: data.manufacturerResale ?? false,
      indicatorResale: data.indicatorResale ?? false,
      recurringResale: data.recurringResale ?? false,
      profilePictureUrl,
      honorificId: data.honorificId ?? null,
    });

    const id = await this.resaleRepository.save(entity);
    return { id };
  }
}
