"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const joi_1 = __importDefault(require("joi"));
const config_service_1 = require("./config.service");
const environment_enum_1 = require("./environment.enum");
let ConfigModule = class ConfigModule {
};
exports.ConfigModule = ConfigModule;
exports.ConfigModule = ConfigModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                expandVariables: true,
                envFilePath: `.env.${process.env.NODE_ENV || environment_enum_1.Environment.Development}`,
                validationSchema: joi_1.default.object({
                    NODE_ENV: joi_1.default.string().valid(...Object.values(environment_enum_1.Environment)).required(),
                    PORT: joi_1.default.number().required(),
                    SSL_KEY: joi_1.default.string().required(),
                    SSL_CERT: joi_1.default.string().required(),
                    SSL_CA: joi_1.default.string().required(),
                    CORS_ORIGIN: joi_1.default.string().required(),
                    JWT_SECRET: joi_1.default.string().required(),
                    DATABASE_URL: joi_1.default.string().required(),
                    AWS_ACCESS_KEY_ID: joi_1.default.string().required(),
                    AWS_SECRET_ACCESS_KEY: joi_1.default.string().required(),
                    AWS_REGION: joi_1.default.string().required(),
                    AWS_BUCKET_NAME: joi_1.default.string().required(),
                    SMTP_HOST: joi_1.default.string().required(),
                    SMTP_PORT: joi_1.default.string().required(),
                    SMTP_TO: joi_1.default.string().required(),
                    SMTP_FROM: joi_1.default.string().required(),
                    SMTP_USERNAME: joi_1.default.string().required(),
                    SMTP_PASSWORD: joi_1.default.string().required(),
                    REDIS_URL: joi_1.default.string().required(),
                }),
            }),
        ],
        providers: [config_service_1.ConfigService],
        exports: [config_service_1.ConfigService],
    })
], ConfigModule);
//# sourceMappingURL=config.module.js.map