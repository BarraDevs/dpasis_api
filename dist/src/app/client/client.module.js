"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientModule = void 0;
const common_1 = require("@nestjs/common");
const guards_module_1 = require("../authentication/application/guards/guards.module");
const client_persistence_module_1 = require("./application/persistence/client-persistence.module");
const create_client_service_1 = require("./application/usecases/create-client/create-client.service");
const edit_client_service_1 = require("./application/usecases/edit-client/edit-client.service");
const find_all_client_service_1 = require("./application/usecases/find-all-client/find-all-client.service");
const find_client_by_id_service_1 = require("./application/usecases/find-client-by-id/find-client-by-id.service");
const client_controller_1 = require("./infra/drivers/http/client.controller");
let ClientModule = class ClientModule {
};
exports.ClientModule = ClientModule;
exports.ClientModule = ClientModule = __decorate([
    (0, common_1.Module)({
        imports: [
            client_persistence_module_1.ClientPersistenceModule,
            guards_module_1.AuthenticationGuardsModule,
        ],
        controllers: [
            client_controller_1.ClientController,
        ],
        providers: [
            create_client_service_1.CreateClient,
            edit_client_service_1.EditClient,
            find_all_client_service_1.FindAllClient,
            find_client_by_id_service_1.FindClientById,
        ],
        exports: [],
    })
], ClientModule);
//# sourceMappingURL=client.module.js.map