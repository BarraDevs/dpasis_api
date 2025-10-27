"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheKeyBuilder = void 0;
class CacheKeyBuilder {
    accountId;
    resource;
    command;
    data;
    setAccount(accountId) {
        this.accountId = accountId;
        return this;
    }
    setResource(resource) {
        this.resource = resource;
        return this;
    }
    setCommand(command, data) {
        this.command = command;
        this.data = data;
        return this;
    }
    build() {
        if (!this.resource)
            throw new Error('Resource é obrigatório');
        if (!this.command)
            throw new Error('Command é obrigatório');
        const keyParts = [];
        keyParts.push('cache');
        keyParts.push(this.accountId ? this.accountId : 'global');
        keyParts.push(this.resource);
        keyParts.push(this.command);
        if (this.data) {
            if (typeof this.data === 'string') {
                keyParts.push(this.data);
            }
            else {
                keyParts.push(JSON.stringify(this.data));
            }
        }
        return keyParts.join(':');
    }
}
exports.CacheKeyBuilder = CacheKeyBuilder;
//# sourceMappingURL=cache-key.builder.js.map