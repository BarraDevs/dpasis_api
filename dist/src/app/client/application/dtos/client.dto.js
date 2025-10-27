"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientDto = void 0;
const openapi = require("@nestjs/swagger");
class ClientDto {
    id;
    kind;
    cnpj;
    ie;
    group;
    type;
    generateInvoice;
    companyName;
    fantasyName;
    owner;
    headquarters;
    active;
    createdAt;
    updatedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, kind: { required: true, type: () => String }, cnpj: { required: true, type: () => String }, ie: { required: true, type: () => String }, group: { required: true, type: () => String }, type: { required: true, type: () => String }, generateInvoice: { required: true, type: () => Boolean }, companyName: { required: true, type: () => String }, fantasyName: { required: true, type: () => String }, owner: { required: true, type: () => String }, headquarters: { required: true, type: () => String }, active: { required: true, type: () => Boolean }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
}
exports.ClientDto = ClientDto;
//# sourceMappingURL=client.dto.js.map