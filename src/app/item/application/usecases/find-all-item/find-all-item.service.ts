// import { Injectable } from '@nestjs/common';
// import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
// import { ItemDto } from '../../dtos/item.dto';
// import { FindAllItemQueryDto } from './dtos/find-all-item.dto';
//
// @Injectable()
// export class FindAllItem {
//   constructor() {}
//
//   public async execute(queries: FindAllItemQueryDto): Promise<IPagination<ItemDto>> {
//     const [result, total] = [[], 0];
//
//     return new Pagination(result, total, queries.page, queries.size).getDto();
//   }
// }
