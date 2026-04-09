import { Inject, Injectable } from '@nestjs/common';
import { FindCnaeById } from 'src/app/global/taxation/cnae/application/usecases/find-cnae-by-id/find-cnae-by-id.service';
import { FindIndopById } from 'src/app/global/taxation/indop/application/usecases/find-indop-by-id/find-indop-by-id.service';
import { FindNbsById } from 'src/app/global/taxation/nbs/application/usecases/find-nbs-by-id/find-nbs-by-id.service';
import { TOKENS } from 'src/core/di/token';
import { CnaeNbsIndopAlreadyExistsError } from '../../../domain/errors/cnae-nbs-indop-already-exists.error';
import type { ICnaeNbsIndopDao } from '../../persistence/dao/cnae-nbs-indop-dao.interface';
import { CreateCnaeNbsIndopInputDto, CreateCnaeNbsIndopOutputDto } from './dtos/create-cnae-nbs-indop.dto';

@Injectable()
export class CreateCnaeNbsIndop {
  constructor(
    @Inject(TOKENS.CnaeNbsIndopDao) private readonly cnaeNbsIndopDao: ICnaeNbsIndopDao,
    private readonly findCnaeById: FindCnaeById,
    private readonly findNbsById: FindNbsById,
    private readonly findIndopById: FindIndopById,
  ) {}

  public async execute(data: CreateCnaeNbsIndopInputDto): Promise<CreateCnaeNbsIndopOutputDto> {
    await this.findCnaeById.execute(data.cnaeId, { onlyActive: true });
    await this.findNbsById.execute(data.nbsId, { onlyActive: true });
    await this.findIndopById.execute(data.indopId, { onlyActive: true });

    const existing = await this.cnaeNbsIndopDao.findByComposite(
      data.cnaeId,
      data.nbsId,
      data.indopId,
    );
    if (existing) {
      throw new CnaeNbsIndopAlreadyExistsError();
    }

    const id = await this.cnaeNbsIndopDao.save(data);
    return { id };
  }
}
