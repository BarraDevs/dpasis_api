"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountPersistenceModule = void 0;
const common_1 = require("@nestjs/common");
const token_1 = require("../../../../core/di/token");
const database_module_1 = require("../../../../infra/database/database.module");
const account_prisma_dao_1 = require("../../infra/driven/persistence/prisma/account-prisma.dao");
const adapters = [
    {
        provide: token_1.TOKENS.AccountDao,
        useClass: account_prisma_dao_1.AccountPrismaAdapterDao,
    },
];
let AccountPersistenceModule = class AccountPersistenceModule {
};
exports.AccountPersistenceModule = AccountPersistenceModule;
exports.AccountPersistenceModule = AccountPersistenceModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule],
        providers: [...adapters],
        exports: [...adapters],
    })
], AccountPersistenceModule);
//# sourceMappingURL=account-persistence.module.js.map