// import { Injectable } from '@nestjs/common';
// import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
// import { LicenseDto } from '../../dtos/license.dto';
// import { FindAllLicenseQueryDto } from './dtos/find-all-license.dto';
//
// @Injectable()
// export class FindAllLicense {
//   constructor() {}
//
//   public async execute(queries: FindAllLicenseQueryDto): Promise<IPagination<LicenseDto>> {
//     const [result, total] = [[], 0];
//
//     return new Pagination(result, total, queries.page, queries.size).getDto();
//   }
// }
