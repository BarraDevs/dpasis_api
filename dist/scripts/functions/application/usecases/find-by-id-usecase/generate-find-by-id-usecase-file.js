"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFindByIdUsecaseFile = generateFindByIdUsecaseFile;
function generateFindByIdUsecaseFile({ moduleName, moduleNamePascal }) {
    return `// import { Injectable } from '@nestjs/common';
// import { ${moduleNamePascal}Dto } from '../../dtos/${moduleName}.dto';
//
// @Injectable()
// export class Find${moduleNamePascal}ById {
//   constructor() {}
//
//   public async execute(id: string): Promise<${moduleNamePascal}Dto> {}
// }
`;
}
//# sourceMappingURL=generate-find-by-id-usecase-file.js.map