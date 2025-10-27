import { Props } from 'scripts/generate-module';

export function generateFindAllUsecaseFile(props: Props) {
  return `// import { Injectable } from '@nestjs/common';
// import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
// import { ${props.moduleNamePascal}Dto } from '../../dtos/${props.moduleName}.dto';
// import { FindAll${props.moduleNamePascal}QueryDto } from './dtos/find-all-${props.moduleName}.dto';
//
// @Injectable()
// export class FindAll${props.moduleNamePascal} {
//   constructor() {}
//
//   public async execute(queries: FindAll${props.moduleNamePascal}QueryDto): Promise<IPagination<${props.moduleNamePascal}Dto>> {
//     const [result, total] = [[], 0];
//
//     return new Pagination(result, total, queries.page, queries.size).getDto();
//   }
// }
`;
}
