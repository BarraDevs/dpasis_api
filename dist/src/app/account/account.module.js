"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountModule = void 0;
const common_1 = require("@nestjs/common");
const account_persistence_module_1 = require("./application/persistence/account-persistence.module");
const find_account_by_credential_service_1 = require("./application/usecases/find-account-by-credential/find-account-by-credential.service");
const find_account_by_id_service_1 = require("./application/usecases/find-account-by-id/find-account-by-id.service");
const providers = [
    find_account_by_credential_service_1.FindAccountByCredential,
    find_account_by_id_service_1.FindAccountById,
];
let AccountModule = class AccountModule {
};
exports.AccountModule = AccountModule;
exports.AccountModule = AccountModule = __decorate([
    (0, common_1.Module)({
        imports: [
            account_persistence_module_1.AccountPersistenceModule,
        ],
        providers: [...providers],
        exports: [...providers],
    })
], AccountModule);
//# sourceMappingURL=account.module.js.map