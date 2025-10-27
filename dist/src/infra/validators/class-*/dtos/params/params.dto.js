"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Params = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const trim_1 = require("../../decorators/trim/trim");
class Params {
    id;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String } };
    }
}
exports.Params = Params;
__decorate([
    (0, class_validator_1.IsString)({ message: '$property deve ser um texto' }),
    (0, class_validator_1.IsNotEmpty)({ message: '$property é obrigatório' }),
    (0, trim_1.Trim)(),
    __metadata("design:type", String)
], Params.prototype, "id", void 0);
//# sourceMappingURL=params.dto.js.map