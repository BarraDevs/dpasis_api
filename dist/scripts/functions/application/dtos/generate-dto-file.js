"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDtoFile = generateDtoFile;
function generateDtoFile(pascalCaseModule) {
    return `export class ${pascalCaseModule}Dto {}`;
}
//# sourceMappingURL=generate-dto-file.js.map