"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminSeed = void 0;
const crypto_1 = __importDefault(require("crypto"));
const account_role_enum_1 = require("../../src/app/account/domain/enums/account-role.enum");
const account_status_enum_1 = require("../../src/app/account/domain/enums/account-status.enum");
const password_vo_1 = require("../../src/shared/value-objects/password/password.vo");
class AdminSeed {
    static data = [
        {
            accountId: crypto_1.default.randomUUID(),
            name: 'Admin Master',
            document: '12345678909',
            role: {
                create: {
                    role: account_role_enum_1.AccountRole.ADMIN,
                    account: {
                        create: {
                            email: 'admin@email.com',
                            password: new password_vo_1.Password('123456').value,
                            status: account_status_enum_1.AccountStatus.ACTIVE,
                        },
                    },
                },
            },
        },
    ];
    static async seed(prisma) {
        for (const data of this.data) {
            await prisma.admin.create({
                data,
            });
        }
        console.log('Admins seeded');
    }
}
exports.AdminSeed = AdminSeed;
//# sourceMappingURL=admin.js.map