"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts_jest_1 = require("@golevelup/ts-jest");
const testing_1 = require("@nestjs/testing");
const client_module_1 = require("../../../client.module");
const config_module_1 = require("../../../../../core/config/config.module");
const prisma_service_1 = require("../../../../../infra/database/prisma/prisma.service");
const create_client_service_1 = require("../create-client/create-client.service");
const find_all_client_service_1 = require("./find-all-client.service");
describe('FindAllClient', () => {
    let sut;
    let prisma;
    let createClient;
    let data;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            imports: [
                client_module_1.ClientModule,
                config_module_1.ConfigModule,
            ],
        }).compile();
        sut = module.get(find_all_client_service_1.FindAllClient);
        prisma = module.get(prisma_service_1.PrismaService);
        createClient = module.get(create_client_service_1.CreateClient);
        data = {
            kind: 'individual',
            cnpj: '12345678000199',
            ie: '123456789',
            group: 'default',
            type: 'customer',
            generateInvoice: true,
            companyName: 'John Doe Ltda',
            fantasyName: 'John Doe',
            owner: 'John Doe',
            headquarters: '123 Main St, City, State, ZIP',
        };
        await prisma.client.deleteMany();
    });
    afterAll(async () => {
        await prisma.client.deleteMany();
    });
    it('should be defined', () => {
        expect(sut).toBeDefined();
    });
    it('should call clientDao with correct parameters', async () => {
        const findAllSpy = jest.spyOn(sut['clientDao'], 'findAll').mockResolvedValue([[], 0]);
        const queries = (0, ts_jest_1.createMock)({ page: 1, size: 10 });
        await sut.execute(queries);
        expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
    it('should return an empty pagination when no clients exist', async () => {
        const result = await sut.execute({});
        expect(result).toEqual({
            data: [],
            currentPage: 1,
            itemsPerPage: 0,
            totalItems: 0,
            totalPages: 0,
        });
    });
    it('should return a pagination with clients when they exist', async () => {
        const client1 = await createClient.execute({ ...data, cnpj: '12345678000199', ie: '123456789' });
        const client2 = await createClient.execute({ ...data, cnpj: '98765432000199', ie: '987654321' });
        const result = await sut.execute({});
        expect(result.currentPage).toBe(1);
        expect(result.totalItems).toBe(2);
        expect(result.totalPages).toBe(1);
        expect(result.itemsPerPage).toBe(2);
        expect(result.data).toEqual(expect.arrayContaining([
            expect.objectContaining({ id: client1.id }),
            expect.objectContaining({ id: client2.id }),
        ]));
    });
    it('should return a pagination with filtered clients based on companyName', async () => {
        const client1 = await createClient.execute({ ...data, companyName: 'Alpha Corp', cnpj: '12345678000199', ie: '123456789' });
        const client2 = await createClient.execute({ ...data, companyName: 'Beta LLC', cnpj: '98765432000199', ie: '987654321' });
        const result = await sut.execute({ companyName: 'Alpha' });
        expect(result.currentPage).toBe(1);
        expect(result.totalItems).toBe(1);
        expect(result.totalPages).toBe(1);
        expect(result.itemsPerPage).toBe(1);
        expect(result.data).toEqual(expect.arrayContaining([
            expect.objectContaining({ id: client1.id }),
        ]));
        expect(result.data).not.toEqual(expect.arrayContaining([
            expect.objectContaining({ id: client2.id }),
        ]));
    });
    it('should return a pagination with filtered clients based on cnpj', async () => {
        const client1 = await createClient.execute({ ...data, cnpj: '12345678000199', ie: '123456789' });
        const client2 = await createClient.execute({ ...data, cnpj: '98765432000199', ie: '987654321' });
        const result = await sut.execute({ cnpj: '12345678' });
        expect(result.currentPage).toBe(1);
        expect(result.totalItems).toBe(1);
        expect(result.totalPages).toBe(1);
        expect(result.itemsPerPage).toBe(1);
        expect(result.data).toEqual(expect.arrayContaining([
            expect.objectContaining({ id: client1.id }),
        ]));
        expect(result.data).not.toEqual(expect.arrayContaining([
            expect.objectContaining({ id: client2.id }),
        ]));
    });
});
//# sourceMappingURL=find-all-client.service.spec.js.map