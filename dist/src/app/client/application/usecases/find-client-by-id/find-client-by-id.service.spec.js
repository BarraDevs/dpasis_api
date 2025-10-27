"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const client_module_1 = require("../../../client.module");
const config_module_1 = require("../../../../../core/config/config.module");
const prisma_service_1 = require("../../../../../infra/database/prisma/prisma.service");
const create_client_service_1 = require("../create-client/create-client.service");
const find_client_by_id_service_1 = require("./find-client-by-id.service");
describe('FindClientById', () => {
    let sut;
    let prisma;
    let createClient;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            imports: [
                client_module_1.ClientModule,
                config_module_1.ConfigModule,
            ],
        }).compile();
        sut = module.get(find_client_by_id_service_1.FindClientById);
        prisma = module.get(prisma_service_1.PrismaService);
        createClient = module.get(create_client_service_1.CreateClient);
        await prisma.client.deleteMany();
    });
    it('should be defined', () => {
        expect(sut).toBeDefined();
    });
    it('should call clientDao with correct arguments', async () => {
        const id = 'client-id';
        const clientDaoSpy = jest.spyOn(sut['clientDao'], 'findById');
        await sut.execute(id);
        expect(clientDaoSpy).toHaveBeenNthCalledWith(1, id);
    });
    it('should return null if client is not found', async () => {
        const result = await sut.execute('id');
        expect(result).toBeNull();
    });
    it('should return correct dto when client is found', async () => {
        const data = {
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
        const createdClient = await createClient.execute(data);
        const result = await sut.execute(createdClient.id);
        expect(result).toEqual({
            id: createdClient.id,
            kind: data.kind,
            cnpj: data.cnpj,
            ie: data.ie,
            group: data.group,
            type: data.type,
            generateInvoice: data.generateInvoice,
            companyName: data.companyName,
            fantasyName: data.fantasyName,
            owner: data.owner,
            headquarters: data.headquarters,
            active: true,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
        });
    });
});
//# sourceMappingURL=find-client-by-id.service.spec.js.map