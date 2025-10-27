"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequiredRoles = RequiredRoles;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const error_dto_1 = require("../../../../infra/openapi/error.dto");
const authentication_guard_1 = require("../../application/guards/authentication/authentication.guard");
const authorization_guard_1 = require("../../application/guards/authorization/authorization.guard");
const jwt_guard_1 = require("../strategies/jwt/jwt.guard");
const set_role_decorator_1 = require("./set-role.decorator");
function RequiredRoles(...roles) {
    return (0, common_1.applyDecorators)((0, set_role_decorator_1.SetRoles)(...roles), (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, authentication_guard_1.AuthenticationGuard, authorization_guard_1.AuthorizationGuard), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiUnauthorizedResponse)({ type: error_dto_1.ServerError, description: 'Unauthorized' }), (0, swagger_1.ApiForbiddenResponse)({ type: error_dto_1.ServerError, description: 'Forbidden' }));
}
//# sourceMappingURL=required-role.decorator.js.map