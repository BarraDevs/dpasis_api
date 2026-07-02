import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { FaqNotFoundError } from '../../../domain/errors/faq-not-found.error';
import type { IFaqDao } from '../../persistence/dao/faq-dao.interface';

@Injectable()
export class UpdateFaqStatus {
  constructor(
    @Inject(TOKENS.FaqDao) private readonly faqDao: IFaqDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const faq = await this.faqDao.findById(id);
    if (!faq) {
      throw new FaqNotFoundError();
    }

    await this.faqDao.updateStatus(id, !faq.active);

    return { message: 'Status da FAQ atualizado com sucesso' };
  }
}
