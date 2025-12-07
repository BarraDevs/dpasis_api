import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnsupportedMediaTypeResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ClientError, ServerError } from './error.dto';

type swaggerProps = {
  tags: string[];
  summary: string;
  description?: string;
  mergeRequestBody?: any;
  okResponse?: any;
  okPaginatedResponse?: any;
  createdResponse?: any;
  applyBadRequest?: boolean;
  applyForbidden?: boolean;
  applyNotFound?: boolean;
  applyConflict?: boolean;
  applyUnsupportedMediaType?: boolean;
}

export function Swagger(props: swaggerProps) {
  return applyDecorators(
    ApiTags(...props.tags),
    ApiOperation({ summary: props.summary, description: props.description }),

    applyMergeRequestBody(props.mergeRequestBody),
    applyOkResponse(props.okResponse),
    applyOkPaginatedResponse(props.okPaginatedResponse),
    applyPaginationModels(props.okPaginatedResponse),
    applyCreatedResponse(props.createdResponse),
    applyBadRequestResponse(props.applyBadRequest),
    applyForbiddenResponse(props.applyForbidden),
    applyNotFoundResponse(props.applyNotFound),
    applyConflictResponse(props.applyConflict),
    applyUnsupportedMediaTypeResponse(props.applyUnsupportedMediaType),

    ApiInternalServerErrorResponse({ type: ServerError, description: 'Internal Server Error' }),
  );
}

function applyMergeRequestBody(dtos?: any[]) {
  return dtos?.length ? applyDecorators(
    ApiExtraModels(...dtos),
    ApiBody({
      schema: {
        allOf: dtos.map(dto => ({
          $ref: getSchemaPath(dto),
        })),
      },
    })
  ) : () => {};
}

function applyOkResponse(dto?: any) {
  return dto ? ApiOkResponse({ type: dto, description: 'OK' }) : () => {};
}

function applyPaginationModels<T extends Type<unknown>>(dto?: T) {
  return dto ? ApiExtraModels(IPagination, dto) : () => {};
}

function applyOkPaginatedResponse<T extends Type<unknown>>(dto?: T) {
  return dto ? ApiOkResponse({
    description: 'OK',
    schema: {
      allOf: [
        { $ref: getSchemaPath(IPagination) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(dto) },
            },
          },
        },
      ],
    },
  }) : () => {};
}

function applyCreatedResponse(type?: any) {
  return type ? ApiCreatedResponse({ type, description: 'Created' }) : () => {};
}

function applyBadRequestResponse(apply?: boolean) {
  return apply ? ApiBadRequestResponse({ type: ClientError, description: 'Bad Request' }) : () => {};
}

function applyForbiddenResponse(apply?: boolean) {
  return apply ? ApiForbiddenResponse({ type: ClientError, description: 'Forbidden' }) : () => {};
}

function applyNotFoundResponse(apply?: boolean) {
  return apply ? ApiNotFoundResponse({ type: ClientError, description: 'Not Found' }) : () => {};
}

function applyConflictResponse(apply?: boolean) {
  return apply ? ApiConflictResponse({ type: ClientError, description: 'Conflict' }) : () => {};
}

function applyUnsupportedMediaTypeResponse(apply?: boolean) {
  return apply ? ApiUnsupportedMediaTypeResponse({ type: ClientError, description: 'Unsupported Media Type' }) : () => {};
}
