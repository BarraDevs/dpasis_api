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
exports.ClientDaoAdapterPrisma = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../../../infra/database/prisma/prisma.service");
let ClientDaoAdapterPrisma = class ClientDaoAdapterPrisma {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll(queries) {
        const pagination = this.prisma.paginationFactory(queries.page, queries.size);
        const where = {
            AND: [
                {
                    OR: [
                        { companyName: { contains: queries.companyName } },
                        { cnpj: { contains: queries.cnpj } },
                    ],
                },
            ],
        };
        return this.prisma.$transaction([
            this.prisma.client.findMany({
                where,
                take: pagination.take,
                skip: pagination.skip,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.client.count({ where }),
        ]);
    }
    findById(id) {
        return this.prisma.client.findUnique({
            where: { id },
        });
    }
    findByCnpj(cnpj) {
        return this.prisma.client.findUnique({
            where: { cnpj },
        });
    }
    findByIe(ie) {
        return this.prisma.client.findUnique({
            where: { ie },
        });
    }
};
exports.ClientDaoAdapterPrisma = ClientDaoAdapterPrisma;
exports.ClientDaoAdapterPrisma = ClientDaoAdapterPrisma = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ClientDaoAdapterPrisma);
//# sourceMappingURL=client.dao.js.map