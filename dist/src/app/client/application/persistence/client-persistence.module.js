"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientPersistenceModule = void 0;
const common_1 = require("@nestjs/common");
const token_1 = require("../../../../core/di/token");
const database_module_1 = require("../../../../infra/database/database.module");
const client_dao_1 = require("../../infra/driven/persistence/prisma/client.dao");
const client_repository_1 = require("../../infra/driven/persistence/prisma/client.repository");
const adapters = [
    {
        provide: token_1.TOKENS.ClientDao,
        useClass: client_dao_1.ClientDaoAdapterPrisma,
    },
    {
        provide: token_1.TOKENS.ClientRepository,
        useClass: client_repository_1.ClientRepositoryAdapterPrisma,
    },
];
let ClientPersistenceModule = class ClientPersistenceModule {
};
exports.ClientPersistenceModule = ClientPersistenceModule;
exports.ClientPersistenceModule = ClientPersistenceModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule],
        providers: [...adapters],
        exports: [...adapters],
    })
], ClientPersistenceModule);
//# sourceMappingURL=client-persistence.module.js.map