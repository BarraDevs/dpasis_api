import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { IndopAlreadyExistsError } from '../../../domain/errors/indop-already-exists.error';
import { IndopNotFoundError } from '../../../domain/errors/indop-not-found.error';
import type { IIndopDao } from '../../persistence/dao/indop-dao.interface';
import { EditIndopInputDto } from './dtos/edit-indop.dto';

@Injectable()
export class EditIndop {
  constructor(
    @Inject(TOKENS.IndopDao) private readonly indopDao: IIndopDao,
  ) {}

  public async execute(id: number, data: EditIndopInputDto): Promise<SuccessMessage> {
    const indop = await this.indopDao.findById(id);
    if (!indop) {
      throw new IndopNotFoundError();
    }

    const existing = await this.indopDao.findByCode(data.code.trim());
    if (existing && existing.id !== id) {
      throw new IndopAlreadyExistsError(data.code);
    }

    await this.indopDao.edit(id, data);

    return { message: 'INDOP atualizado com sucesso' };
  }
}
