// import { Injectable } from '@nestjs/common';
// import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
// import { ProductDto } from '../../dtos/product.dto';
// import { FindAllProductQueryDto } from './dtos/find-all-product.dto';
//
// @Injectable()
// export class FindAllProduct {
//   constructor() {}
//
//   public async execute(queries: FindAllProductQueryDto): Promise<IPagination<ProductDto>> {
//     const [result, total] = [[], 0];
//
//     return new Pagination(result, total, queries.page, queries.size).getDto();
//   }
// }
