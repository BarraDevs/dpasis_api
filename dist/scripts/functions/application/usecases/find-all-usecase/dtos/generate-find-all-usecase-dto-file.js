"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFindAllUsecaseDtoFile = generateFindAllUsecaseDtoFile;
function generateFindAllUsecaseDtoFile({ moduleNamePascal }) {
    return `import { Queries } from 'src/infra/validators/class-*/dtos/queries/queries.dto';

export class FindAll${moduleNamePascal}QueryDto extends Queries {}
`;
}
//# sourceMappingURL=generate-find-all-usecase-dto-file.js.map