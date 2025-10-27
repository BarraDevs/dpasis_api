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
exports.FindAllClientQueryDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const trim_1 = require("../../../../../../infra/validators/class-*/decorators/trim/trim");
const queries_dto_1 = require("../../../../../../infra/validators/class-*/dtos/queries/queries.dto");
class FindAllClientQueryDto extends queries_dto_1.Queries {
    companyName;
    cnpj;
    static _OPENAPI_METADATA_FACTORY() {
        return { companyName: { required: false, type: () => String }, cnpj: { required: false, type: () => String } };
    }
}
exports.FindAllClientQueryDto = FindAllClientQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, trim_1.Trim)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '$property deve ser um texto' }),
    __metadata("design:type", String)
], FindAllClientQueryDto.prototype, "companyName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, trim_1.Trim)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '$property deve ser um texto' }),
    __metadata("design:type", String)
], FindAllClientQueryDto.prototype, "cnpj", void 0);
//# sourceMappingURL=find-all-client.dto.js.map