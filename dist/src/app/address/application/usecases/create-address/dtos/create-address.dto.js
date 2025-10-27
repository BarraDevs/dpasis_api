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
exports.CreateAddressOutputDto = exports.CreateAddressInputDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const trim_1 = require("../../../../../../infra/validators/class-*/decorators/trim/trim");
class CreateAddressInputDto {
    nickname;
    zipCode;
    street;
    number;
    complement;
    reference;
    neighborhood;
    city;
    state;
    ownerId;
    static _OPENAPI_METADATA_FACTORY() {
        return { nickname: { required: false, type: () => String }, zipCode: { required: true, type: () => String }, street: { required: true, type: () => String }, number: { required: true, type: () => String }, complement: { required: false, type: () => String }, reference: { required: false, type: () => String }, neighborhood: { required: true, type: () => String }, city: { required: true, type: () => String }, state: { required: true, type: () => String }, ownerId: { required: true, type: () => String } };
    }
}
exports.CreateAddressInputDto = CreateAddressInputDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '$property deve ser uma string' }),
    (0, trim_1.Trim)(),
    __metadata("design:type", String)
], CreateAddressInputDto.prototype, "nickname", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: '$property deve ser uma string' }),
    (0, class_validator_1.IsNotEmpty)({ message: '$property é obrigatório' }),
    (0, trim_1.Trim)(),
    __metadata("design:type", String)
], CreateAddressInputDto.prototype, "zipCode", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: '$property deve ser uma string' }),
    (0, class_validator_1.IsNotEmpty)({ message: '$property é obrigatório' }),
    (0, trim_1.Trim)(),
    __metadata("design:type", String)
], CreateAddressInputDto.prototype, "street", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: '$property deve ser uma string' }),
    (0, class_validator_1.IsNotEmpty)({ message: '$property é obrigatório' }),
    (0, trim_1.Trim)(),
    __metadata("design:type", String)
], CreateAddressInputDto.prototype, "number", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '$property deve ser uma string' }),
    (0, trim_1.Trim)(),
    __metadata("design:type", String)
], CreateAddressInputDto.prototype, "complement", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '$property deve ser uma string' }),
    (0, trim_1.Trim)(),
    __metadata("design:type", String)
], CreateAddressInputDto.prototype, "reference", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: '$property deve ser uma string' }),
    (0, class_validator_1.IsNotEmpty)({ message: '$property é obrigatório' }),
    (0, trim_1.Trim)(),
    __metadata("design:type", String)
], CreateAddressInputDto.prototype, "neighborhood", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: '$property deve ser uma string' }),
    (0, class_validator_1.IsNotEmpty)({ message: '$property é obrigatório' }),
    (0, trim_1.Trim)(),
    __metadata("design:type", String)
], CreateAddressInputDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: '$property deve ser uma string' }),
    (0, class_validator_1.IsNotEmpty)({ message: '$property é obrigatório' }),
    (0, trim_1.Trim)(),
    __metadata("design:type", String)
], CreateAddressInputDto.prototype, "state", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: '$property deve ser uma string' }),
    (0, class_validator_1.IsNotEmpty)({ message: '$property é obrigatório' }),
    (0, trim_1.Trim)(),
    __metadata("design:type", String)
], CreateAddressInputDto.prototype, "ownerId", void 0);
class CreateAddressOutputDto {
    id;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String } };
    }
}
exports.CreateAddressOutputDto = CreateAddressOutputDto;
//# sourceMappingURL=create-address.dto.js.map