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
exports.FindClientById = void 0;
const common_1 = require("@nestjs/common");
const token_1 = require("../../../../../core/di/token");
let FindClientById = class FindClientById {
    clientDao;
    constructor(clientDao) {
        this.clientDao = clientDao;
    }
    async execute(id) {
        return this.clientDao.findById(id);
    }
};
exports.FindClientById = FindClientById;
exports.FindClientById = FindClientById = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(token_1.TOKENS.ClientDao)),
    __metadata("design:paramtypes", [Object])
], FindClientById);
//# sourceMappingURL=find-client-by-id.service.js.map