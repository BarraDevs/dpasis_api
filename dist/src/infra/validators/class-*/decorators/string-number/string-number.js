"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StringToNumber = StringToNumber;
const class_transformer_1 = require("class-transformer");
function StringToNumber(opts) {
    return (0, class_transformer_1.Transform)(({ value }) => (typeof value === 'string') ? Number(value) : value, opts);
}
//# sourceMappingURL=string-number.js.map