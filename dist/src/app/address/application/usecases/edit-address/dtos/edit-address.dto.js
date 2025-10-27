"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditAddressInputDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const create_address_dto_1 = require("../../create-address/dtos/create-address.dto");
class EditAddressInputDto extends (0, swagger_1.PartialType)(create_address_dto_1.CreateAddressInputDto) {
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.EditAddressInputDto = EditAddressInputDto;
//# sourceMappingURL=edit-address.dto.js.map