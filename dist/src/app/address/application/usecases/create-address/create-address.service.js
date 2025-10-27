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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateAddress = void 0;
const common_1 = require("@nestjs/common");
const address_main_must_be_one_error_1 = require("../../../domain/errors/address-main-must-be-one.error");
const token_1 = require("../../../../../core/di/token");
let CreateAddress = class CreateAddress {
    addressDao;
    constructor(addressDao) {
        this.addressDao = addressDao;
    }
    async execute(data, isMain) {
        const existingMainAddress = await this.addressDao.findMainAddress(data.ownerId);
        if (isMain && existingMainAddress) {
            throw new address_main_must_be_one_error_1.AddressMainMustBeOneError();
        }
        const createdAddressId = await this.addressDao.save(data, isMain);
        return { id: createdAddressId };
    }
};
exports.CreateAddress = CreateAddress;
exports.CreateAddress = CreateAddress = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(token_1.TOKENS.AddressDao)),
    __metadata("design:paramtypes", [Object])
], CreateAddress);
//# sourceMappingURL=create-address.service.js.map