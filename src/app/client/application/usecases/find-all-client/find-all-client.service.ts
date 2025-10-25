// import { Injectable } from '@nestjs/common';
// import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination';
// import { ClientDto } from '../../dtos/client.dto';
// import { FindAllClientQueryDto } from './dtos/find-all-client.dto';
//
// @Injectable()
// export class FindAllClient {
//   constructor() {}
//
//   public async execute(queries: FindAllClientQueryDto): Promise<IPagination<ClientDto>> {
//     const [result, total] = [[], 0];
//
//     return new Pagination(result, total, queries.page, queries.size).getDto();
//   }
// }
