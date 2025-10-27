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
exports.FindAllAddress = void 0;
const common_1 = require("@nestjs/common");
const token_1 = require("../../../../../core/di/token");
const pagination_vo_1 = require("../../../../../shared/value-objects/pagination/pagination.vo");
let FindAllAddress = class FindAllAddress {
    addressDao;
    constructor(addressDao) {
        this.addressDao = addressDao;
    }
    async execute(queries) {
        const [result, total] = await this.addressDao.findAll(queries);
        return new pagination_vo_1.Pagination(result, total, queries.page, queries.size).getDto();
    }
};
exports.FindAllAddress = FindAllAddress;
exports.FindAllAddress = FindAllAddress = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(token_1.TOKENS.AddressDao)),
    __metadata("design:paramtypes", [Object])
], FindAllAddress);
//# sourceMappingURL=find-all-address.service.js.map