import { Inject, Injectable } from '@nestjs/common';
import { FaqNotFoundError } from 'src/app/faq/domain/errors/faq-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IFaqDao } from '../../persistence/dao/faq-dao.interface';

@Injectable()
export class DeleteFaq {
  constructor(
    @Inject(TOKENS.FaqDao) private readonly faqDao: IFaqDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const faq = await this.faqDao.findById(id);
    if (!faq) {
      throw new FaqNotFoundError();
    }

    await this.faqDao.delete(id);

    return { message: 'FAQ excluído com sucesso' };
  }
}
