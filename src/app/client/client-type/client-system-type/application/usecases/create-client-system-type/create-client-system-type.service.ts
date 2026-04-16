import { Inject, Injectable } from '@nestjs/common';
import { UploadSingle } from 'src/app/upload-file/application/usecases/upload-single/upload-single.service';
import { TOKENS } from 'src/core/di/token';
import { ClientSystemTypeAlreadyExistsError } from '../../../domain/errors/client-system-type-already-exists.error';
import { ClientSystemTypeImageFolder } from '../../../domain/value-objects/client-system-type-image-folder.vo';
import type { IClientSystemTypeDao } from '../../persistence/dao/client-system-type-dao.interface';
import { CreateClientSystemTypeInputDto, CreateClientSystemTypeOutputDto } from './dtos/create-client-system-type.dto';

@Injectable()
export class CreateClientSystemType {
  constructor(
    @Inject(TOKENS.ClientSystemTypeDao) private readonly clientSystemTypeDao: IClientSystemTypeDao,
    private readonly uploadSingle: UploadSingle,
  ) {}

  public async execute(data: CreateClientSystemTypeInputDto, file?: Express.Multer.File): Promise<CreateClientSystemTypeOutputDto> {
    const existing = await this.clientSystemTypeDao.findByName(data.name);
    if (existing) {
      throw new ClientSystemTypeAlreadyExistsError(data.name);
    }

    let imageUrl: string | null = null;

    if (data.imageUrl !== null && data.imageUrl !== undefined) {
      imageUrl = data.imageUrl;
    }
    else if (file) {
      const folder = new ClientSystemTypeImageFolder();
      const result = await this.uploadSingle.execute(file, folder.value);
      imageUrl = result.url;
    }

    const id = await this.clientSystemTypeDao.save({
      name: data.name,
      imageUrl,
    });

    return { id };
  }
}
