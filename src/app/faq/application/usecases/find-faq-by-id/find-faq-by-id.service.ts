import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { FaqNotFoundError } from '../../../domain/errors/faq-not-found.error';
import { FaqDto } from '../../dtos/faq.dto';
import type { IFaqDao } from '../../persistence/dao/faq-dao.interface';

@Injectable()
export class FindFaqById {
  constructor(
    @Inject(TOKENS.FaqDao) private readonly faqDao: IFaqDao,
  ) {}

  public async execute(id: string): Promise<FaqDto> {
    const faq = await this.faqDao.findById(id);
    if (!faq) {
      throw new FaqNotFoundError();
    }

    return faq;
  }
}
