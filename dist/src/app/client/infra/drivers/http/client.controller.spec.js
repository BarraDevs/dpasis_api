"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts_jest_1 = require("@golevelup/ts-jest");
const testing_1 = require("@nestjs/testing");
const client_module_1 = require("../../../client.module");
const config_module_1 = require("../../../../../core/config/config.module");
const client_controller_1 = require("./client.controller");
describe('ClientController', () => {
    let sut;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            imports: [
                client_module_1.ClientModule,
                config_module_1.ConfigModule,
            ],
        }).compile();
        sut = module.get(client_controller_1.ClientController);
    });
    it('should be defined', () => {
        expect(sut).toBeDefined();
    });
    describe('create', () => {
        it('should call createClientService with correct parameters', async () => {
            const input = (0, ts_jest_1.createMock)();
            const output = (0, ts_jest_1.createMock)();
            const createClientSpy = jest.spyOn(sut['createClientService'], 'execute').mockResolvedValue(output);
            const result = await sut.create(input);
            expect(createClientSpy).toHaveBeenCalledWith(input);
            expect(result).toEqual(output);
        });
    });
    describe('findAll', () => {
        it('should call findAllClientService with correct parameters', async () => {
            const queries = (0, ts_jest_1.createMock)();
            const output = (0, ts_jest_1.createMock)();
            const findAllClientSpy = jest.spyOn(sut['findAllClientService'], 'execute').mockResolvedValue(output);
            const result = await sut.findAll(queries);
            expect(findAllClientSpy).toHaveBeenCalledWith(queries);
            expect(result).toEqual(output);
        });
    });
    describe('findById', () => {
        it('should call findClientByIdService with correct parameters', async () => {
            const params = (0, ts_jest_1.createMock)();
            const output = (0, ts_jest_1.createMock)();
            const findClientByIdSpy = jest.spyOn(sut['findClientByIdService'], 'execute').mockResolvedValue(output);
            const result = await sut.findOne(params);
            expect(findClientByIdSpy).toHaveBeenCalledWith(params.id);
            expect(result).toEqual(output);
        });
    });
    describe('update', () => {
        it('should call editClientService with correct parameters', async () => {
            const params = (0, ts_jest_1.createMock)();
            const body = (0, ts_jest_1.createMock)();
            const output = (0, ts_jest_1.createMock)();
            const editClientSpy = jest.spyOn(sut['editClientService'], 'execute').mockResolvedValue(output);
            const result = await sut.update(params, body);
            expect(editClientSpy).toHaveBeenCalledWith(params.id, body);
            expect(result).toEqual(output);
        });
    });
});
//# sourceMappingURL=client.controller.spec.js.map