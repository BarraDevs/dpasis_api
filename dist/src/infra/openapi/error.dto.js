"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerError = exports.ClientError = void 0;
const openapi = require("@nestjs/swagger");
class ClientError {
    message;
    error;
    statusCode;
    static _OPENAPI_METADATA_FACTORY() {
        return { message: { required: true, type: () => String }, error: { required: true, type: () => String }, statusCode: { required: true, type: () => Number } };
    }
}
exports.ClientError = ClientError;
class ServerError {
    message;
    error;
    statusCode;
    static _OPENAPI_METADATA_FACTORY() {
        return { message: { required: true, type: () => String }, error: { required: true, type: () => String }, statusCode: { required: true, type: () => Number } };
    }
}
exports.ServerError = ServerError;
//# sourceMappingURL=error.dto.js.map