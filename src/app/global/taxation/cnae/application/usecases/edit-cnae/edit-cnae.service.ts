import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { CnaeAlreadyExistsError } from '../../../domain/errors/cnae-already-exists.error';
import { CnaeNotFoundError } from '../../../domain/errors/cnae-not-found.error';
import type { ICnaeDao } from '../../persistence/dao/cnae-dao.interface';
import { EditCnaeInputDto } from './dtos/edit-cnae.dto';

@Injectable()
export class EditCnae {
  constructor(
    @Inject(TOKENS.CnaeDao) private readonly cnaeDao: ICnaeDao,
  ) {}

  public async execute(id: number, data: EditCnaeInputDto): Promise<SuccessMessage> {
    const cnae = await this.cnaeDao.findById(id);
    if (!cnae) {
      throw new CnaeNotFoundError();
    }

    const existing = await this.cnaeDao.findByCode(data.code.trim());
    if (existing && existing.id !== id) {
      throw new CnaeAlreadyExistsError(data.code);
    }

    await this.cnaeDao.edit(id, data);

    return { message: 'CNAE atualizado com sucesso' };
  }
}
