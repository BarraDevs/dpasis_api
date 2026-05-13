import { Inject, Injectable } from '@nestjs/common';
import type { IUploadFileQueueProducer } from 'src/app/upload-file/application/queue/upload-file-queue-producer.interface';
import { UploadSingle } from 'src/app/upload-file/application/usecases/upload-single/upload-single.service';
import { ResaleType } from 'src/app/resale/resale/domain/enums/resale-type.enum';
import { ResaleNotFoundError } from 'src/app/resale/resale/domain/errors/resale-not-found.error';
import { ResaleFactory } from 'src/app/resale/resale/domain/factories/resale.factory';
import { ResaleProfilePictureFolder } from 'src/app/resale/resale/domain/value-objects/resale-profile-picture-folder.vo';
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
    @Inject(TOKENS.UploadFileQueueProducer) private readonly uploadFileQueueProducer: IUploadFileQueueProducer,
    private readonly uploadSingle: UploadSingle,
  ) {}

  public async execute(id: number, data: EditResaleInputDto, file?: Express.Multer.File): Promise<SuccessMessage> {
    const resale = await this.resaleDao.findById(id);
    if (!resale) {
      throw new ResaleNotFoundError();
    }

    const previousProfilePictureUrl = resale.profilePictureUrl;

    let profilePictureUrl = previousProfilePictureUrl ?? null;

    if (file) {
      const folder = new ResaleProfilePictureFolder(id);
      const result = await this.uploadSingle.execute(file, folder.value);
      profilePictureUrl = result.url;
    }

    const resaleEntity = ResaleFactory.edit({
      id,
      type: data.type !== undefined ? data.type : (resale.type as ResaleType),
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
      nickname: data.nickname !== undefined ? data.nickname : resale.nickname,
      socialName: data.socialName !== undefined ? data.socialName : resale.socialName,
      validityDate:
        data.validityDate !== undefined
          ? (data.validityDate ? new Date(data.validityDate) : null)
          : resale.validityDate,
      accessEmail: data.accessEmail !== undefined ? data.accessEmail : resale.accessEmail,
      accessPassword: data.accessPassword !== undefined ? data.accessPassword : resale.accessPassword,
      paymentDay: data.paymentDay !== undefined ? data.paymentDay : resale.paymentDay,
      bonus: data.bonus !== undefined ? data.bonus : resale.bonus,
      billingStartDay: data.billingStartDay !== undefined ? data.billingStartDay : resale.billingStartDay,
      receivesSupportEmail: data.receivesSupportEmail ?? resale.receivesSupportEmail,
      servedByRoot: data.servedByRoot ?? resale.servedByRoot,
      manufacturerResale: data.manufacturerResale ?? resale.manufacturerResale,
      indicatorResale: data.indicatorResale ?? resale.indicatorResale,
      recurringResale: data.recurringResale ?? resale.recurringResale,
      profilePictureUrl,
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

    if (file && previousProfilePictureUrl) {
      await this.uploadFileQueueProducer.addDeleteJob({ fileUrl: previousProfilePictureUrl });
    }

    return { message: 'Edição realizada com sucesso' };
  }
}
