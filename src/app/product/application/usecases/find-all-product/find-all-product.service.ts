import { Inject, Injectable } from '@nestjs/common';
import { FindCompanyById } from 'src/app/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { CompanyNotFoundError } from 'src/app/company/domain/errors/company-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ProductDto } from '../../dtos/product.dto';
import type { IProductDao } from '../../persistence/dao/product-dao.interface';
import { FindAllProductQueryDto } from './dtos/find-all-product.dto';

@Injectable()
export class FindAllProduct {
  constructor(
    @Inject(TOKENS.ProductDao) private readonly productDao: IProductDao,
    private readonly findCompanyById: FindCompanyById,
  ) {}

  public async execute(queries: FindAllProductQueryDto): Promise<IPagination<ProductDto>> {
    const company = await this.findCompanyById.execute(queries.companyId);
    if (!company) {
      throw new CompanyNotFoundError();
    }

    const [result, total] = await this.productDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
