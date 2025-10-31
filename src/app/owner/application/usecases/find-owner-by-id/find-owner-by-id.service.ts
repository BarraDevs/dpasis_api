import { Inject, Injectable } from '@nestjs/common';
import { OwnerNotFoundError } from 'src/app/owner/domain/errors/owner-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { OwnerDto } from '../../dtos/owner.dto';
import type { IOwnerDao } from '../../persistence/dao/owner-dao.interface';

@Injectable()
export class FindOwnerById {
  constructor(
    @Inject(TOKENS.OwnerDao) private readonly ownerDao: IOwnerDao,
  ) {}

  public async execute(id: string): Promise<OwnerDto> {
    const owner = await this.ownerDao.findById(id);
    if (!owner) {
      throw new OwnerNotFoundError();
    }

    return owner;
  }
}
