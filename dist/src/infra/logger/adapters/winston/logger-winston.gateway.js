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
exports.LoggerWinstonAdapterGateway = void 0;
const common_1 = require("@nestjs/common");
const winston_1 = require("winston");
const logger_gateway_1 = require("../../logger.gateway");
let LoggerWinstonAdapterGateway = class LoggerWinstonAdapterGateway {
    logger;
    filterByContext(context) {
        return winston_1.format.combine((0, winston_1.format)(info => info.context === context ? info : false)(), winston_1.format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }), winston_1.format.json());
    }
    generateTransport(context) {
        return new winston_1.transports.File({
            level: 'debug',
            filename: `logs/${context}.log`,
            format: this.filterByContext(context),
        });
    }
    constructor() {
        const transports = Object.values(logger_gateway_1.LogContext).map(context => this.generateTransport(context));
        this.logger = (0, winston_1.createLogger)({ transports });
    }
    debug(context, data) {
        this.logger.log('debug', { context, data });
    }
    error(context, data) {
        this.logger.log('error', { context, data });
    }
};
exports.LoggerWinstonAdapterGateway = LoggerWinstonAdapterGateway;
exports.LoggerWinstonAdapterGateway = LoggerWinstonAdapterGateway = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], LoggerWinstonAdapterGateway);
//# sourceMappingURL=logger-winston.gateway.js.map