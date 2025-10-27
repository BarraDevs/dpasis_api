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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const environment_enum_1 = require("./environment.enum");
let ConfigService = class ConfigService {
    nestConfigService;
    constructor(nestConfigService) {
        this.nestConfigService = nestConfigService;
    }
    get nodeEnv() {
        return this.nestConfigService.get('NODE_ENV');
    }
    get isDevelopment() {
        return this.nodeEnv === environment_enum_1.Environment.Development;
    }
    get isProduction() {
        return this.nodeEnv === environment_enum_1.Environment.Production;
    }
    get isTest() {
        return this.nodeEnv === environment_enum_1.Environment.Test;
    }
    get port() {
        return this.nestConfigService.get('PORT');
    }
    get sslKeyPath() {
        return this.nestConfigService.get('SSL_KEY');
    }
    get sslCertPath() {
        return this.nestConfigService.get('SSL_CERT');
    }
    get sslCaPath() {
        return this.nestConfigService.get('SSL_CA');
    }
    get corsOrigin() {
        return this.nestConfigService.get('CORS_ORIGIN');
    }
    get jwtSecret() {
        return this.nestConfigService.get('JWT_SECRET');
    }
    get databaseUrl() {
        return this.nestConfigService.get('DATABASE_URL');
    }
    get awsAccessKeyId() {
        return this.nestConfigService.get('AWS_ACCESS_KEY_ID');
    }
    get awsSecretAccessKey() {
        return this.nestConfigService.get('AWS_SECRET_ACCESS_KEY');
    }
    get awsRegion() {
        return this.nestConfigService.get('AWS_REGION');
    }
    get awsBucketName() {
        return this.nestConfigService.get('AWS_BUCKET_NAME');
    }
    get smtpHost() {
        return this.nestConfigService.get('SMTP_HOST');
    }
    get smtpPort() {
        return this.nestConfigService.get('SMTP_PORT');
    }
    get smtpTo() {
        return this.nestConfigService.get('SMTP_TO');
    }
    get smtpFrom() {
        return this.nestConfigService.get('SMTP_FROM');
    }
    get smtpUsername() {
        return this.nestConfigService.get('SMTP_USERNAME');
    }
    get smtpPassword() {
        return this.nestConfigService.get('SMTP_PASSWORD');
    }
    get redisUrl() {
        return this.nestConfigService.get('REDIS_URL');
    }
};
exports.ConfigService = ConfigService;
exports.ConfigService = ConfigService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ConfigService);
//# sourceMappingURL=config.service.js.map