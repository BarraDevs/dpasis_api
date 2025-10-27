"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
const openapi = require("@nestjs/swagger");
class Client {
    _id;
    _props;
    static create(props) {
        return new Client({
            ...props,
            id: crypto.randomUUID(),
            active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }
    static load(props) {
        return new Client(props);
    }
    get props() {
        return { ...this._props, id: this._id };
    }
    constructor(props) {
        this._id = props.id;
        this._props = props;
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { _id: { required: true, type: () => String }, _props: { required: true, type: () => Object } };
    }
}
exports.Client = Client;
//# sourceMappingURL=client.entity.js.map