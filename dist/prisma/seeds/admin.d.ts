import { PrismaClient } from '@prisma/client';
export declare class AdminSeed {
    private static data;
    static seed(prisma: PrismaClient): Promise<void>;
}
