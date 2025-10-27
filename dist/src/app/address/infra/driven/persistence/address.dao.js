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
exports.AddressDaoAdapterPrisma = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../../infra/database/prisma/prisma.service");
let AddressDaoAdapterPrisma = class AddressDaoAdapterPrisma {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async save(data, isMain) {
        const address = await this.prisma.address.create({
            data: { ...data, isMain },
        });
        return address.id;
    }
    async findAll(queries) {
        const pagination = this.prisma.paginationFactory(queries.page, queries.size);
        const where = {
            isMain: queries.isMain,
            ownerId: queries.ownerId,
        };
        return this.prisma.$transaction([
            this.prisma.address.findMany({
                where,
                take: pagination.take,
                skip: pagination.skip,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.address.count({ where }),
        ]);
    }
    async findById(id, isMain) {
        return this.prisma.address.findUnique({
            where: { id, isMain },
        });
    }
    async findMainAddress(id) {
        return this.prisma.address.findFirst({
            where: { ownerId: id, isMain: true },
        });
    }
    async edit(id, data) {
        await this.prisma.address.update({
            where: { id },
            data,
        });
    }
    async delete(id) {
        await this.prisma.address.delete({
            where: { id },
        });
    }
};
exports.AddressDaoAdapterPrisma = AddressDaoAdapterPrisma;
exports.AddressDaoAdapterPrisma = AddressDaoAdapterPrisma = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AddressDaoAdapterPrisma);
//# sourceMappingURL=address.dao.js.map