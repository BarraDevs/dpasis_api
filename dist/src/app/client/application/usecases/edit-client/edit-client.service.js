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
exports.EditClient = void 0;
const common_1 = require("@nestjs/common");
const client_entity_1 = require("../../../domain/entities/client.entity");
const client_not_found_1 = require("../../../domain/errors/client-not-found");
const duplicate_cnpj_error_1 = require("../../../domain/errors/duplicate-cnpj.error");
const duplicate_ie_error_1 = require("../../../domain/errors/duplicate-ie.error");
const token_1 = require("../../../../../core/di/token");
let EditClient = class EditClient {
    clientDao;
    clientRepository;
    constructor(clientDao, clientRepository) {
        this.clientDao = clientDao;
        this.clientRepository = clientRepository;
    }
    async execute(id, data) {
        const clientData = await this.clientDao.findById(id);
        if (!clientData) {
            throw new client_not_found_1.ClientNotFoundError();
        }
        if (data.cnpj && data.cnpj !== clientData.cnpj) {
            const existingClientWithCnpj = await this.clientDao.findByCnpj(data.cnpj);
            if (existingClientWithCnpj) {
                throw new duplicate_cnpj_error_1.ClientDuplicateCnpjError();
            }
        }
        if (data.ie && data.ie !== clientData.ie) {
            const existingClientWithIe = await this.clientDao.findByIe(data.ie);
            if (existingClientWithIe) {
                throw new duplicate_ie_error_1.ClientDuplicateIeError();
            }
        }
        const client = client_entity_1.Client.load({
            ...clientData,
            ...data,
        });
        await this.clientRepository.edit(client);
        return {
            message: 'Cliente editado com sucesso!',
        };
    }
};
exports.EditClient = EditClient;
exports.EditClient = EditClient = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(token_1.TOKENS.ClientDao)),
    __param(1, (0, common_1.Inject)(token_1.TOKENS.ClientRepository)),
    __metadata("design:paramtypes", [Object, Object])
], EditClient);
//# sourceMappingURL=edit-client.service.js.map