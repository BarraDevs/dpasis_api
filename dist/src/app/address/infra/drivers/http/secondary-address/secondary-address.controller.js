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
exports.AddressSecondaryController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const address_dto_1 = require("../../../../application/dtos/address.dto");
const create_address_service_1 = require("../../../../application/usecases/create-address/create-address.service");
const create_address_dto_1 = require("../../../../application/usecases/create-address/dtos/create-address.dto");
const delete_address_service_1 = require("../../../../application/usecases/delete-address/delete-address.service");
const edit_address_dto_1 = require("../../../../application/usecases/edit-address/dtos/edit-address.dto");
const edit_address_service_1 = require("../../../../application/usecases/edit-address/edit-address.service");
const find_address_by_id_service_1 = require("../../../../application/usecases/find-address-by-id/find-address-by-id.service");
const find_all_address_dto_1 = require("../../../../application/usecases/find-all-address/dtos/find-all-address.dto");
const find_all_address_service_1 = require("../../../../application/usecases/find-all-address/find-all-address.service");
const success_message_dto_1 = require("../../../../../../core/dtos/success-message.dto");
const swagger_1 = require("../../../../../../infra/openapi/swagger");
const params_dto_1 = require("../../../../../../infra/validators/class-*/dtos/params/params.dto");
let AddressSecondaryController = class AddressSecondaryController {
    createAddressService;
    findAllAddressService;
    findAddressByIdService;
    editAddressService;
    deleteAddressService;
    IS_MAIN = false;
    constructor(createAddressService, findAllAddressService, findAddressByIdService, editAddressService, deleteAddressService) {
        this.createAddressService = createAddressService;
        this.findAllAddressService = findAllAddressService;
        this.findAddressByIdService = findAddressByIdService;
        this.editAddressService = editAddressService;
        this.deleteAddressService = deleteAddressService;
    }
    create(body) {
        return this.createAddressService.execute(body, this.IS_MAIN);
    }
    findAll(queries) {
        return this.findAllAddressService.execute({ ...queries, isMain: this.IS_MAIN });
    }
    findOne(params) {
        return this.findAddressByIdService.execute(params.id, this.IS_MAIN);
    }
    update(params, body) {
        return this.editAddressService.execute(params.id, this.IS_MAIN, body);
    }
    remove(params) {
        return this.deleteAddressService.execute(params.id);
    }
};
exports.AddressSecondaryController = AddressSecondaryController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.Swagger)({
        tags: ['Endereços secundários'],
        summary: 'Rota para criar um novo endereço secundário',
        applyBadRequest: true,
        createdResponse: create_address_dto_1.CreateAddressOutputDto,
    }),
    openapi.ApiResponse({ status: 201, type: require("../../../../application/usecases/create-address/dtos/create-address.dto").CreateAddressOutputDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_address_dto_1.CreateAddressInputDto]),
    __metadata("design:returntype", Promise)
], AddressSecondaryController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.Swagger)({
        tags: ['Endereços secundários'],
        summary: 'Rota para listar todos os endereços secundários',
        applyBadRequest: true,
        okPaginatedResponse: address_dto_1.AddressDto,
    }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [find_all_address_dto_1.FindAllAddressQueryDto]),
    __metadata("design:returntype", Promise)
], AddressSecondaryController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.Swagger)({
        tags: ['Endereços secundários'],
        summary: 'Rota para buscar um endereço secundário por ID',
        applyBadRequest: true,
        applyNotFound: true,
        okResponse: address_dto_1.AddressDto,
    }),
    openapi.ApiResponse({ status: 200, type: require("../../../../application/dtos/address.dto").AddressDto }),
    __param(0, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [params_dto_1.Params]),
    __metadata("design:returntype", Promise)
], AddressSecondaryController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.Swagger)({
        tags: ['Endereços secundários'],
        summary: 'Rota para editar um endereço secundário',
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
], AddressSecondaryController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.Swagger)({
        tags: ['Endereços secundários'],
        summary: 'Rota para deletar um endereço secundário',
        applyBadRequest: true,
        applyNotFound: true,
        okResponse: success_message_dto_1.SuccessMessage,
    }),
    openapi.ApiResponse({ status: 200, type: require("../../../../../../core/dtos/success-message.dto").SuccessMessage }),
    __param(0, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [params_dto_1.Params]),
    __metadata("design:returntype", Promise)
], AddressSecondaryController.prototype, "remove", null);
exports.AddressSecondaryController = AddressSecondaryController = __decorate([
    (0, common_1.Controller)('address/secondary'),
    __metadata("design:paramtypes", [create_address_service_1.CreateAddress,
        find_all_address_service_1.FindAllAddress,
        find_address_by_id_service_1.FindAddressById,
        edit_address_service_1.EditAddress,
        delete_address_service_1.DeleteAddress])
], AddressSecondaryController);
//# sourceMappingURL=secondary-address.controller.js.map