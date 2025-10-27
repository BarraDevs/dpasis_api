"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuccessMessage = void 0;
const openapi = require("@nestjs/swagger");
class SuccessMessage {
    message;
    static _OPENAPI_METADATA_FACTORY() {
        return { message: { required: true, type: () => String } };
    }
}
exports.SuccessMessage = SuccessMessage;
//# sourceMappingURL=success-message.dto.js.map