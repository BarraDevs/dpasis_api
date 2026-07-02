import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { IFaqDao } from '../../persistence/dao/faq-dao.interface';
import { CreateFaqInputDto, CreateFaqOutputDto } from './dtos/create-faq.dto';

@Injectable()
export class CreateFaq {
  constructor(
    @Inject(TOKENS.FaqDao) private readonly faqDao: IFaqDao,
  ) {}

  public async execute(data: CreateFaqInputDto): Promise<CreateFaqOutputDto> {
    const id = await this.faqDao.save(data);
    return { id };
  }
}
