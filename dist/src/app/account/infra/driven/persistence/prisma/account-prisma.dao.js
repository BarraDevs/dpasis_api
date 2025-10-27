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
exports.AccountPrismaAdapterDao = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../../../infra/database/prisma/prisma.service");
const AccountSelect = {
    id: true,
    roles: true,
    status: true,
    email: true,
};
const AccountWithSensitiveDataSelect = {
    ...AccountSelect,
    password: true,
    passwordResetToken: true,
};
let AccountPrismaAdapterDao = class AccountPrismaAdapterDao {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByCredential(credential) {
        const account = await this.prisma.account.findUnique({
            where: { email: credential },
            select: AccountWithSensitiveDataSelect,
        });
        if (!account) {
            return null;
        }
        return {
            ...account,
            status: account.status,
            roles: account.roles.map(r => r.role),
        };
    }
    async findByEmail(email) {
        const account = await this.prisma.account.findUnique({
            where: { email },
            select: AccountWithSensitiveDataSelect,
        });
        if (!account) {
            return null;
        }
        return {
            ...account,
            status: account.status,
            roles: account.roles.map(r => r.role),
        };
    }
    async findById(id) {
        const account = await this.prisma.account.findUnique({
            where: { id },
            select: AccountSelect,
        });
        if (!account) {
            return null;
        }
        return {
            ...account,
            status: account.status,
            roles: account.roles.map(r => r.role),
        };
    }
    async forgotPassword(id, passwordResetToken) {
        await this.prisma.account.update({
            where: { id },
            data: { passwordResetToken },
        });
    }
    async resetPassword(id, password) {
        await this.prisma.account.update({
            where: { id },
            data: {
                password,
                passwordResetToken: null,
            },
        });
    }
};
exports.AccountPrismaAdapterDao = AccountPrismaAdapterDao;
exports.AccountPrismaAdapterDao = AccountPrismaAdapterDao = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AccountPrismaAdapterDao);
//# sourceMappingURL=account-prisma.dao.js.map