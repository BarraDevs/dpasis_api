// import { Injectable } from '@nestjs/common';
// import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
// import { AttachmentDto } from '../../dtos/attachment.dto';
// import { FindAllAttachmentQueryDto } from './dtos/find-all-attachment.dto';
//
// @Injectable()
// export class FindAllAttachment {
//   constructor() {}
//
//   public async execute(queries: FindAllAttachmentQueryDto): Promise<IPagination<AttachmentDto>> {
//     const [result, total] = [[], 0];
//
//     return new Pagination(result, total, queries.page, queries.size).getDto();
//   }
// }
