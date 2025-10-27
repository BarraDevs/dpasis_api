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
exports.CreateClientOutputDto = exports.CreateClientInputDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const trim_1 = require("../../../../../../infra/validators/class-*/decorators/trim/trim");
class CreateClientInputDto {
    kind;
    cnpj;
    ie;
    group;
    type;
    generateInvoice;
    companyName;
    fantasyName;
    owner;
    headquarters;
    static _OPENAPI_METADATA_FACTORY() {
        return { kind: { required: true, type: () => String }, cnpj: { required: true, type: () => String }, ie: { required: true, type: () => String }, group: { required: true, type: () => String }, type: { required: true, type: () => String }, generateInvoice: { required: true, type: () => Boolean }, companyName: { required: true, type: () => String }, fantasyName: { required: true, type: () => String }, owner: { required: true, type: () => String }, headquarters: { required: true, type: () => String } };
    }
}
exports.CreateClientInputDto = CreateClientInputDto;
__decorate([
    (0, class_validator_1.IsString)({ message: '$property deve ser uma string' }),
    (0, class_validator_1.IsNotEmpty)({ message: '$property é obrigatório' }),
    (0, trim_1.Trim)(),
    __metadata("design:type", String)
], CreateClientInputDto.prototype, "kind", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: '$property deve ser uma string' }),
    (0, class_validator_1.IsNotEmpty)({ message: '$property é obrigatório' }),
    (0, trim_1.Trim)(),
    __metadata("design:type", String)
], CreateClientInputDto.prototype, "cnpj", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: '$property deve ser uma string' }),
    (0, class_validator_1.IsNotEmpty)({ message: '$property é obrigatório' }),
    (0, trim_1.Trim)(),
    __metadata("design:type", String)
], CreateClientInputDto.prototype, "ie", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: '$property deve ser uma string' }),
    (0, class_validator_1.IsNotEmpty)({ message: '$property é obrigatório' }),
    (0, trim_1.Trim)(),
    __metadata("design:type", String)
], CreateClientInputDto.prototype, "group", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: '$property deve ser uma string' }),
    (0, class_validator_1.IsNotEmpty)({ message: '$property é obrigatório' }),
    (0, trim_1.Trim)(),
    __metadata("design:type", String)
], CreateClientInputDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: '$property é obrigatório' }),
    (0, class_validator_1.IsBoolean)({ message: '$property deve ser booleano' }),
    (0, trim_1.Trim)(),
    __metadata("design:type", Boolean)
], CreateClientInputDto.prototype, "generateInvoice", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: '$property deve ser uma string' }),
    (0, class_validator_1.IsNotEmpty)({ message: '$property é obrigatório' }),
    (0, trim_1.Trim)(),
    __metadata("design:type", String)
], CreateClientInputDto.prototype, "companyName", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: '$property deve ser uma string' }),
    (0, class_validator_1.IsNotEmpty)({ message: '$property é obrigatório' }),
    (0, trim_1.Trim)(),
    __metadata("design:type", String)
], CreateClientInputDto.prototype, "fantasyName", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: '$property deve ser uma string' }),
    (0, class_validator_1.IsNotEmpty)({ message: '$property é obrigatório' }),
    (0, trim_1.Trim)(),
    __metadata("design:type", String)
], CreateClientInputDto.prototype, "owner", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: '$property deve ser uma string' }),
    (0, class_validator_1.IsNotEmpty)({ message: '$property é obrigatório' }),
    (0, trim_1.Trim)(),
    __metadata("design:type", String)
], CreateClientInputDto.prototype, "headquarters", void 0);
class CreateClientOutputDto {
    id;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String } };
    }
}
exports.CreateClientOutputDto = CreateClientOutputDto;
//# sourceMappingURL=create-client.dto.js.map