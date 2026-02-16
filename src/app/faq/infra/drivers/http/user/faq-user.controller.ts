import { Controller, Get, Query } from '@nestjs/common';
import { FaqDto } from 'src/app/faq/application/dtos/faq.dto';
import { FindAllFaqQueryDto } from 'src/app/faq/application/usecases/find-all-faq/dtos/find-all-faq.dto';
import { FindAllFaq } from 'src/app/faq/application/usecases/find-all-faq/find-all-faq.service';
import { Swagger } from 'src/infra/openapi/swagger';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('user/faq')
export class FaqUserController {
  constructor(
    private readonly findAllFaq: FindAllFaq,
  ) {}

  @Get()
  @Swagger({
    tags: ['FAQs - Público'],
    summary: 'Listar FAQs com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: FaqDto,
  })
  public findAll(@Query() queries: FindAllFaqQueryDto): Promise<IPagination<FaqDto>> {
    return this.findAllFaq.execute(queries);
  }
}
