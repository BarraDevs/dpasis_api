import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { FindByIdOptions } from 'src/core/types/find-by-id-options.type';
import { DeliveryTermNotFoundError } from '../../../domain/errors/delivery-term-not-found.error';
import { DeliveryTermDto } from '../../dtos/delivery-term.dto';
import type { IDeliveryTermDao } from '../../persistence/dao/delivery-term-dao.interface';

@Injectable()
export class FindDeliveryTermById {
  constructor(
    @Inject(TOKENS.DeliveryTermDao) private readonly deliveryTermDao: IDeliveryTermDao,
  ) {}

  public async execute(id: number, options: FindByIdOptions = {}): Promise<DeliveryTermDto> {
    const deliveryTerm = await this.deliveryTermDao.findById(id);
    if (!deliveryTerm) {
      throw new DeliveryTermNotFoundError();
    }
    if (options.onlyActive && !deliveryTerm.active) {
      throw new DeliveryTermNotFoundError();
    }

    return deliveryTerm;
  }
}
