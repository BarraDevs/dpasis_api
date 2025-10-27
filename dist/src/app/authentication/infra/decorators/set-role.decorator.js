"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetRoles = exports.ROLE_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.ROLE_KEY = 'ROLE';
const SetRoles = (...roles) => (0, common_1.SetMetadata)(exports.ROLE_KEY, roles);
exports.SetRoles = SetRoles;
//# sourceMappingURL=set-role.decorator.js.map