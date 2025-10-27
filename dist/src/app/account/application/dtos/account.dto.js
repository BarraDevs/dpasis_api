"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountWithSensitiveDataDto = exports.AccountDto = void 0;
const openapi = require("@nestjs/swagger");
class AccountDto {
    id;
    email;
    status;
    roles;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, email: { required: true, type: () => String }, status: { required: true, enum: require("../../domain/enums/account-status.enum").AccountStatus }, roles: { required: true, enum: require("../../domain/enums/account-role.enum").AccountRole, isArray: true } };
    }
}
exports.AccountDto = AccountDto;
class AccountWithSensitiveDataDto extends AccountDto {
    password;
    passwordResetToken;
    static _OPENAPI_METADATA_FACTORY() {
        return { password: { required: true, type: () => String }, passwordResetToken: { required: true, type: () => String, nullable: true } };
    }
}
exports.AccountWithSensitiveDataDto = AccountWithSensitiveDataDto;
//# sourceMappingURL=account.dto.js.map