"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressDto = void 0;
const openapi = require("@nestjs/swagger");
class AddressDto {
    id;
    isMain;
    nickname;
    zipCode;
    street;
    number;
    complement;
    reference;
    neighborhood;
    city;
    state;
    ownerId;
    createdAt;
    updatedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, isMain: { required: true, type: () => Boolean }, nickname: { required: true, type: () => String, nullable: true }, zipCode: { required: true, type: () => String }, street: { required: true, type: () => String }, number: { required: true, type: () => String }, complement: { required: true, type: () => String, nullable: true }, reference: { required: true, type: () => String, nullable: true }, neighborhood: { required: true, type: () => String }, city: { required: true, type: () => String }, state: { required: true, type: () => String }, ownerId: { required: true, type: () => String }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
}
exports.AddressDto = AddressDto;
//# sourceMappingURL=address.dto.js.map