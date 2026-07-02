import { Inject, Injectable } from '@nestjs/common';
import { FaqNotFoundError } from 'src/app/global/faq/domain/errors/faq-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IFaqDao } from '../../persistence/dao/faq-dao.interface';
import { EditFaqInputDto } from './dtos/edit-faq.dto';

@Injectable()
export class EditFaq {
  constructor(
    @Inject(TOKENS.FaqDao) private readonly faqDao: IFaqDao,
  ) {}

  public async execute(id: number, data: EditFaqInputDto): Promise<SuccessMessage> {
    const faq = await this.faqDao.findById(id);
    if (!faq) {
      throw new FaqNotFoundError();
    }

    await this.faqDao.edit(id, data);

    return { message: 'FAQ atualizado com sucesso' };
  }
}
