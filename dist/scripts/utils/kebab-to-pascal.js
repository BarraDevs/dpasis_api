"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kebabToPascalCase = kebabToPascalCase;
function kebabToPascalCase(kebabStr) {
    return kebabStr
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
}
//# sourceMappingURL=kebab-to-pascal.js.map