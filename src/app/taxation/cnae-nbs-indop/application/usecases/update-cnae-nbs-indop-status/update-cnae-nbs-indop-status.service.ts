import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { CnaeNbsIndopNotFoundError } from '../../../domain/errors/cnae-nbs-indop-not-found.error';
import type { ICnaeNbsIndopDao } from '../../persistence/dao/cnae-nbs-indop-dao.interface';

@Injectable()
export class UpdateCnaeNbsIndopStatus {
  constructor(
    @Inject(TOKENS.CnaeNbsIndopDao) private readonly cnaeNbsIndopDao: ICnaeNbsIndopDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const cnaeNbsIndop = await this.cnaeNbsIndopDao.findById(id);
    if (!cnaeNbsIndop) {
      throw new CnaeNbsIndopNotFoundError();
    }

    await this.cnaeNbsIndopDao.updateStatus(id, !cnaeNbsIndop.active);

    return { message: 'Status da combinação CNAE/NBS/INDOP atualizado com sucesso' };
  }
}
