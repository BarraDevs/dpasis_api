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
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const address_main_cannot_be_deleted_error_1 = require("../../../app/address/domain/errors/address-main-cannot-be-deleted.error");
const address_main_must_be_one_error_1 = require("../../../app/address/domain/errors/address-main-must-be-one.error");
const address_not_found_error_1 = require("../../../app/address/domain/errors/address-not-found.error");
const forbidden_account_error_1 = require("../../../app/authentication/application/errors/forbidden-account.error");
const inactive_account_error_1 = require("../../../app/authentication/application/errors/inactive-account.error");
const invalid_credential_error_1 = require("../../../app/authentication/application/errors/invalid-credential.error");
const client_not_found_1 = require("../../../app/client/domain/errors/client-not-found");
const duplicate_cnpj_error_1 = require("../../../app/client/domain/errors/duplicate-cnpj.error");
const duplicate_ie_error_1 = require("../../../app/client/domain/errors/duplicate-ie.error");
const token_1 = require("../../di/token");
const logger_gateway_1 = require("../../../infra/logger/logger.gateway");
let HttpExceptionFilter = class HttpExceptionFilter extends core_1.BaseExceptionFilter {
    logger;
    SENSITIVE_FIELDS = [
        'password',
    ];
    constructor(logger) {
        super();
        this.logger = logger;
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest();
        const response = ctx.getResponse();
        this.logger.error(logger_gateway_1.LogContext.HTTP, {
            accountId: request?.user?.sub,
            method: request.method,
            url: request.url,
            body: this.sanitizeBody(request.body),
            params: request.params,
            query: request.query,
            statusCode: exception.code ?? common_1.HttpStatus.BAD_REQUEST,
            error: exception.message,
        });
        response
            .status(exception.code ?? common_1.HttpStatus.BAD_REQUEST)
            .json({ message: exception.message });
    }
    sanitizeBody(body) {
        if (Array.isArray(body)) {
            return body.map((item) => this.sanitizeBody(item));
        }
        if (body && typeof body === 'object') {
            const sanitized = {};
            for (const key of Object.keys(body)) {
                if (this.isSensitiveField(key)) {
                    sanitized[key] = '****';
                }
                else {
                    sanitized[key] = this.sanitizeBody(body[key]);
                }
            }
            return sanitized;
        }
        return body;
    }
    isSensitiveField(field) {
        return this.SENSITIVE_FIELDS.includes(field.toLowerCase());
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = __decorate([
    (0, common_1.Catch)(invalid_credential_error_1.InvalidCredentialError, inactive_account_error_1.InactiveAccountError, forbidden_account_error_1.ForbiddenAccountError, client_not_found_1.ClientNotFoundError, duplicate_cnpj_error_1.ClientDuplicateCnpjError, duplicate_ie_error_1.ClientDuplicateIeError, address_not_found_error_1.AddressNotFoundError, address_main_cannot_be_deleted_error_1.AddressMainCannotBeDeletedError, address_main_must_be_one_error_1.AddressMainMustBeOneError),
    __param(0, (0, common_1.Inject)(token_1.TOKENS.LoggerGateway)),
    __metadata("design:paramtypes", [Object])
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map