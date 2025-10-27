"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEditUsecaseFile = generateEditUsecaseFile;
function generateEditUsecaseFile({ moduleName, moduleNamePascal }) {
    return `// import { Injectable } from '@nestjs/common';
// import { SuccessMessage } from 'src/core/dtos/success-message.dto';
// import { Edit${moduleNamePascal}InputDto } from './dtos/edit-${moduleName}.dto';
//
// @Injectable()
// export class Edit${moduleNamePascal} {
//   constructor() {}
//
//   public async execute(id: string, data: Edit${moduleNamePascal}InputDto): Promise<SuccessMessage> {
//     return { message: 'Edição realizada com sucesso' };
//   }
// }
`;
}
//# sourceMappingURL=generate-edit-usecase-file.js.map