"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const admin_1 = require("./admin");
const prisma = new client_1.PrismaClient();
async function main() {
    await admin_1.AdminSeed.seed(prisma);
}
main()
    .catch((e) => {
    throw e;
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=index.js.map