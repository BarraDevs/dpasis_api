import { OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
export declare class PrismaService extends PrismaClient implements OnModuleInit {
    constructor();
    onModuleInit(): Promise<void>;
    paginationFactory(page?: number, size?: number): {
        skip: number | undefined;
        take: number | undefined;
    };
}
