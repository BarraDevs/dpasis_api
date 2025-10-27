"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Trim = Trim;
const class_transformer_1 = require("class-transformer");
function Trim(opts) {
    return (0, class_transformer_1.Transform)(({ value }) => (typeof value === 'string') ? value.trim() : value, opts);
}
//# sourceMappingURL=trim.js.map