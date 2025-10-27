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
exports.ClientController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const required_role_decorator_1 = require("../../../../authentication/infra/decorators/required-role.decorator");
const client_dto_1 = require("../../../application/dtos/client.dto");
const create_client_service_1 = require("../../../application/usecases/create-client/create-client.service");
const create_client_dto_1 = require("../../../application/usecases/create-client/dtos/create-client.dto");
const edit_client_dto_1 = require("../../../application/usecases/edit-client/dtos/edit-client.dto");
const edit_client_service_1 = require("../../../application/usecases/edit-client/edit-client.service");
const find_all_client_dto_1 = require("../../../application/usecases/find-all-client/dtos/find-all-client.dto");
const find_all_client_service_1 = require("../../../application/usecases/find-all-client/find-all-client.service");
const find_client_by_id_service_1 = require("../../../application/usecases/find-client-by-id/find-client-by-id.service");
const success_message_dto_1 = require("../../../../../core/dtos/success-message.dto");
const swagger_1 = require("../../../../../infra/openapi/swagger");
const params_dto_1 = require("../../../../../infra/validators/class-*/dtos/params/params.dto");
let ClientController = class ClientController {
    createClientService;
    findAllClientService;
    findClientByIdService;
    editClientService;
    constructor(createClientService, findAllClientService, findClientByIdService, editClientService) {
        this.createClientService = createClientService;
        this.findAllClientService = findAllClientService;
        this.findClientByIdService = findClientByIdService;
        this.editClientService = editClientService;
    }
    create(body) {
        return this.createClientService.execute(body);
    }
    findAll(queries) {
        return this.findAllClientService.execute(queries);
    }
    findOne(params) {
        return this.findClientByIdService.execute(params.id);
    }
    update(params, body) {
        return this.editClientService.execute(params.id, body);
    }
};
exports.ClientController = ClientController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.Swagger)({
        tags: ['Clientes'],
        summary: 'Rota para criar um cliente',
        applyBadRequest: true,
        applyConflict: true,
        createdResponse: create_client_dto_1.CreateClientOutputDto,
    }),
    openapi.ApiResponse({ status: 201, type: require("../../../application/usecases/create-client/dtos/create-client.dto").CreateClientOutputDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_client_dto_1.CreateClientInputDto]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.Swagger)({
        tags: ['Clientes'],
        summary: 'Rota para listar todos os clientes',
        applyBadRequest: true,
        okPaginatedResponse: client_dto_1.ClientDto,
    }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [find_all_client_dto_1.FindAllClientQueryDto]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.Swagger)({
        tags: ['Clientes'],
        summary: 'Rota para buscar cliente por ID',
        applyBadRequest: true,
        okResponse: client_dto_1.ClientDto,
    }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [params_dto_1.Params]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.Swagger)({
        tags: ['Clientes'],
        summary: 'Rota para editar cliente',
        applyBadRequest: true,
        applyNotFound: true,
        okResponse: success_message_dto_1.SuccessMessage,
    }),
    openapi.ApiResponse({ status: 200, type: require("../../../../../core/dtos/success-message.dto").SuccessMessage }),
    __param(0, (0, common_1.Param)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [params_dto_1.Params, edit_client_dto_1.EditClientInputDto]),
    __metadata("design:returntype", Promise)
], ClientController.prototype, "update", null);
exports.ClientController = ClientController = __decorate([
    (0, common_1.Controller)('client'),
    (0, required_role_decorator_1.RequiredRoles)(),
    __metadata("design:paramtypes", [create_client_service_1.CreateClient,
        find_all_client_service_1.FindAllClient,
        find_client_by_id_service_1.FindClientById,
        edit_client_service_1.EditClient])
], ClientController);
//# sourceMappingURL=client.controller.js.map