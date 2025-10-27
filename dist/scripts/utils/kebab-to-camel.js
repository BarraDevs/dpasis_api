"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kebabToCamelCase = kebabToCamelCase;
function kebabToCamelCase(kebabStr) {
    return kebabStr
        .split('-')
        .map((word, index) => index === 0
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
}
//# sourceMappingURL=kebab-to-camel.js.map