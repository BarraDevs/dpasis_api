"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressModule = void 0;
const common_1 = require("@nestjs/common");
const address_persistence_module_1 = require("./application/persistence/address-persistence.module");
const create_address_service_1 = require("./application/usecases/create-address/create-address.service");
const delete_address_service_1 = require("./application/usecases/delete-address/delete-address.service");
const edit_address_service_1 = require("./application/usecases/edit-address/edit-address.service");
const find_address_by_id_service_1 = require("./application/usecases/find-address-by-id/find-address-by-id.service");
const find_all_address_service_1 = require("./application/usecases/find-all-address/find-all-address.service");
const find_main_address_service_1 = require("./application/usecases/find-main-address/find-main-address.service");
const main_address_controller_1 = require("./infra/drivers/http/main-address/main-address.controller");
const secondary_address_controller_1 = require("./infra/drivers/http/secondary-address/secondary-address.controller");
let AddressModule = class AddressModule {
};
exports.AddressModule = AddressModule;
exports.AddressModule = AddressModule = __decorate([
    (0, common_1.Module)({
        imports: [
            address_persistence_module_1.AddressPersistenceModule,
        ],
        controllers: [
            main_address_controller_1.AddressMainController,
            secondary_address_controller_1.AddressSecondaryController,
        ],
        providers: [
            create_address_service_1.CreateAddress,
            delete_address_service_1.DeleteAddress,
            edit_address_service_1.EditAddress,
            find_all_address_service_1.FindAllAddress,
            find_address_by_id_service_1.FindAddressById,
            find_main_address_service_1.FindMainAddress,
        ],
        exports: [],
    })
], AddressModule);
//# sourceMappingURL=address.module.js.map