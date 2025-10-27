"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDeleteUsecaseFile = generateDeleteUsecaseFile;
function generateDeleteUsecaseFile({ moduleNamePascal }) {
    return `// import { Injectable } from '@nestjs/common';
// import { SuccessMessage } from 'src/core/dtos/success-message.dto';
//
// @Injectable()
// export class Delete${moduleNamePascal} {
//   constructor() {}
//
//   public async execute(id: string): Promise<SuccessMessage> {
//     return { message: 'Exclusão realizada com sucesso' };
//   }
// }
`;
}
//# sourceMappingURL=generate-delete-usecase-file.js.map