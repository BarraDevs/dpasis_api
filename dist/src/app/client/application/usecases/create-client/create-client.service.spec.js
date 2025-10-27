"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const client_module_1 = require("../../../client.module");
const client_entity_1 = require("../../../domain/entities/client.entity");
const duplicate_cnpj_error_1 = require("../../../domain/errors/duplicate-cnpj.error");
const duplicate_ie_error_1 = require("../../../domain/errors/duplicate-ie.error");
const config_module_1 = require("../../../../../core/config/config.module");
const prisma_service_1 = require("../../../../../infra/database/prisma/prisma.service");
const find_client_by_id_service_1 = require("../find-client-by-id/find-client-by-id.service");
const create_client_service_1 = require("./create-client.service");
describe('CreateClient', () => {
    let sut;
    let prisma;
    let findClientById;
    let data;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            imports: [
                client_module_1.ClientModule,
                config_module_1.ConfigModule,
            ],
        }).compile();
        sut = module.get(create_client_service_1.CreateClient);
        findClientById = module.get(find_client_by_id_service_1.FindClientById);
        prisma = module.get(prisma_service_1.PrismaService);
        await prisma.client.deleteMany();
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
    });
    afterAll(async () => {
        await prisma.client.deleteMany();
    });
    it('should be defined', () => {
        expect(sut).toBeDefined();
    });
    it('should throw an error if cnpj is duplicated', async () => {
        await sut.execute(data);
        expect.assertions(1);
        return sut.execute(data).catch((error) => {
            expect(error).toBeInstanceOf(duplicate_cnpj_error_1.ClientDuplicateCnpjError);
        });
    });
    it('should throw an error if ie is duplicated', async () => {
        await sut.execute({
            ...data,
            cnpj: 'anothercnpj12345678',
        });
        expect.assertions(1);
        return sut.execute(data).catch((error) => {
            expect(error).toBeInstanceOf(duplicate_ie_error_1.ClientDuplicateIeError);
        });
    });
    it('should call clientDao.findByCnpj with correct values', async () => {
        const findByCnpjSpy = jest.spyOn(sut['clientDao'], 'findByCnpj');
        await sut.execute(data);
        expect(findByCnpjSpy).toHaveBeenCalledWith(data.cnpj);
    });
    it('should call clientDao.findByIe with correct values', async () => {
        const findByIeSpy = jest.spyOn(sut['clientDao'], 'findByIe');
        await sut.execute(data);
        expect(findByIeSpy).toHaveBeenCalledWith(data.ie);
    });
    it('should call clientRepository.save with correct values', async () => {
        jest.spyOn(sut['clientDao'], 'findByCnpj').mockResolvedValue(null);
        jest.spyOn(sut['clientDao'], 'findByIe').mockResolvedValue(null);
        const saveSpy = jest.spyOn(sut['clientRepository'], 'save');
        await sut.execute(data);
        expect(saveSpy).toHaveBeenCalledWith(expect.any(client_entity_1.Client));
    });
    it('should return the created client id', async () => {
        const result = await sut.execute(data);
        expect(result).toHaveProperty('id', expect.any(String));
    });
    it('should create a new client entity', async () => {
        const createSpy = jest.spyOn(client_entity_1.Client, 'create');
        await sut.execute(data);
        expect(createSpy).toHaveBeenNthCalledWith(1, data);
    });
    it('should handle concurrent creation attempts correctly', async () => {
        const data1 = { ...data, cnpj: 'concurrent1', ie: 'ie1' };
        const data2 = { ...data, cnpj: 'concurrent2', ie: 'ie2' };
        const [result1, result2] = await Promise.all([
            sut.execute(data1),
            sut.execute(data2),
        ]);
        expect(result1.id).not.toBe(result2.id);
    });
    it('should create with correct default values', async () => {
        const result = await sut.execute(data);
        const createdClient = await findClientById.execute(result.id);
        expect(createdClient).toEqual(expect.objectContaining({
            active: true,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
        }));
    });
    it('should create a client', async () => {
        const result = await sut.execute(data);
        expect(result).toHaveProperty('id', expect.any(String));
        const createdClient = await findClientById.execute(result.id);
        expect(createdClient).toEqual({
            ...data,
            id: result.id,
            active: true,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
        });
    });
});
//# sourceMappingURL=create-client.service.spec.js.map