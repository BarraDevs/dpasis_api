"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheFakeAdapterGateway = void 0;
const common_1 = require("@nestjs/common");
let CacheFakeAdapterGateway = class CacheFakeAdapterGateway {
    async set(_key, _value, _ttlInSeconds, _skipLog) { }
    async get(_key) { return null; }
    async delete(_key) { }
    async deleteContaining(_key) { }
};
exports.CacheFakeAdapterGateway = CacheFakeAdapterGateway;
exports.CacheFakeAdapterGateway = CacheFakeAdapterGateway = __decorate([
    (0, common_1.Injectable)()
], CacheFakeAdapterGateway);
//# sourceMappingURL=cache-fake.gateway.js.map