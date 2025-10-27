"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditClientInputDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const create_client_dto_1 = require("../../create-client/dtos/create-client.dto");
class EditClientInputDto extends (0, swagger_1.PartialType)(create_client_dto_1.CreateClientInputDto) {
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.EditClientInputDto = EditClientInputDto;
//# sourceMappingURL=edit-client.dto.js.map