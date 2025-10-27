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
exports.AddressMainController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const address_dto_1 = require("../../../../application/dtos/address.dto");
const create_address_service_1 = require("../../../../application/usecases/create-address/create-address.service");
const create_address_dto_1 = require("../../../../application/usecases/create-address/dtos/create-address.dto");
const edit_address_dto_1 = require("../../../../application/usecases/edit-address/dtos/edit-address.dto");
const edit_address_service_1 = require("../../../../application/usecases/edit-address/edit-address.service");
const find_main_address_service_1 = require("../../../../application/usecases/find-main-address/find-main-address.service");
const success_message_dto_1 = require("../../../../../../core/dtos/success-message.dto");
const swagger_1 = require("../../../../../../infra/openapi/swagger");
const params_dto_1 = require("../../../../../../infra/validators/class-*/dtos/params/params.dto");
let AddressMainController = class AddressMainController {
    createAddressService;
    findMainAddressService;
    editAddressService;
    IS_MAIN = true;
    constructor(createAddressService, findMainAddressService, editAddressService) {
        this.createAddressService = createAddressService;
        this.findMainAddressService = findMainAddressService;
        this.editAddressService = editAddressService;
    }
    create(body) {
        return this.createAddressService.execute(body, this.IS_MAIN);
    }
    findOne(params) {
        return this.findMainAddressService.execute(params.id);
    }
    update(params, body) {
        return this.editAddressService.execute(params.id, this.IS_MAIN, body);
    }
};
exports.AddressMainController = AddressMainController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.Swagger)({
        tags: ['Endereço principal'],
        summary: 'Rota para criar um novo endereço principal',
        applyBadRequest: true,
        createdResponse: create_address_dto_1.CreateAddressOutputDto,
    }),
    openapi.ApiResponse({ status: 201, type: require("../../../../application/usecases/create-address/dtos/create-address.dto").CreateAddressOutputDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_address_dto_1.CreateAddressInputDto]),
    __metadata("design:returntype", Promise)
], AddressMainController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.Swagger)({
        tags: ['Endereço principal'],
        summary: 'Rota para buscar o endereço principal',
        description: 'O id informado deve ser o ownerId',
        applyBadRequest: true,
        okResponse: address_dto_1.AddressDto,
    }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [params_dto_1.Params]),
    __metadata("design:returntype", Promise)
], AddressMainController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.Swagger)({
        tags: ['Endereço principal'],
        summary: 'Rota para editar o endereço principal',
        description: 'O id informado deve ser o id do endereço',
        applyBadRequest: true,
        applyNotFound: true,
        okResponse: success_message_dto_1.SuccessMessage,
    }),
    openapi.ApiResponse({ status: 200, type: require("../../../../../../core/dtos/success-message.dto").SuccessMessage }),
    __param(0, (0, common_1.Param)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [params_dto_1.Params, edit_address_dto_1.EditAddressInputDto]),
    __metadata("design:returntype", Promise)
], AddressMainController.prototype, "update", null);
exports.AddressMainController = AddressMainController = __decorate([
    (0, common_1.Controller)('address/main'),
    __metadata("design:paramtypes", [create_address_service_1.CreateAddress,
        find_main_address_service_1.FindMainAddress,
        edit_address_service_1.EditAddress])
], AddressMainController);
//# sourceMappingURL=main-address.controller.js.map