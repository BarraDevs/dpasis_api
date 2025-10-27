"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Swagger = Swagger;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const pagination_vo_1 = require("../../shared/value-objects/pagination/pagination.vo");
const error_dto_1 = require("./error.dto");
function Swagger(props) {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiTags)(...props.tags), (0, swagger_1.ApiOperation)({ summary: props.summary, description: props.description }), applyOkResponse(props.okResponse), applyOkPaginatedResponse(props.okPaginatedResponse), applyPaginationModels(props.okPaginatedResponse), applyCreatedResponse(props.createdResponse), applyBadRequestResponse(props.applyBadRequest), applyForbiddenResponse(props.applyForbidden), applyNotFoundResponse(props.applyNotFound), applyConflictResponse(props.applyConflict), applyUnsupportedMediaTypeResponse(props.applyUnsupportedMediaType), (0, swagger_1.ApiInternalServerErrorResponse)({ type: error_dto_1.ServerError, description: 'Internal Server Error' }));
}
function applyOkResponse(dto) {
    return dto ? (0, swagger_1.ApiOkResponse)({ type: dto, description: 'OK' }) : () => { };
}
function applyPaginationModels(dto) {
    return dto ? (0, swagger_1.ApiExtraModels)(pagination_vo_1.IPagination, dto) : () => { };
}
function applyOkPaginatedResponse(dto) {
    return dto ? (0, swagger_1.ApiOkResponse)({
        description: 'OK',
        schema: {
            allOf: [
                { $ref: (0, swagger_1.getSchemaPath)(pagination_vo_1.IPagination) },
                {
                    properties: {
                        data: {
                            type: 'array',
                            items: { $ref: (0, swagger_1.getSchemaPath)(dto) },
                        },
                    },
                },
            ],
        },
    }) : () => { };
}
function applyCreatedResponse(type) {
    return type ? (0, swagger_1.ApiCreatedResponse)({ type, description: 'Created' }) : () => { };
}
function applyBadRequestResponse(apply) {
    return apply ? (0, swagger_1.ApiBadRequestResponse)({ type: error_dto_1.ClientError, description: 'Bad Request' }) : () => { };
}
function applyForbiddenResponse(apply) {
    return apply ? (0, swagger_1.ApiForbiddenResponse)({ type: error_dto_1.ClientError, description: 'Forbidden' }) : () => { };
}
function applyNotFoundResponse(apply) {
    return apply ? (0, swagger_1.ApiNotFoundResponse)({ type: error_dto_1.ClientError, description: 'Not Found' }) : () => { };
}
function applyConflictResponse(apply) {
    return apply ? (0, swagger_1.ApiConflictResponse)({ type: error_dto_1.ClientError, description: 'Conflict' }) : () => { };
}
function applyUnsupportedMediaTypeResponse(apply) {
    return apply ? (0, swagger_1.ApiUnsupportedMediaTypeResponse)({ type: error_dto_1.ClientError, description: 'Unsupported Media Type' }) : () => { };
}
//# sourceMappingURL=swagger.js.map