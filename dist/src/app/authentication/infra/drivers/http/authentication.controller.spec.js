"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts_jest_1 = require("@golevelup/ts-jest");
const testing_1 = require("@nestjs/testing");
const authentication_module_1 = require("../../../authentication.module");
const authentication_controller_1 = require("./authentication.controller");
describe('AuthenticationController', () => {
    let sut;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            imports: [authentication_module_1.AuthenticationModule],
        }).compile();
        sut = module.get(authentication_controller_1.AuthenticationController);
    });
    it('should login', async () => {
        const body = (0, ts_jest_1.createMock)();
        const output = (0, ts_jest_1.createMock)();
        const signinSpy = jest.spyOn(sut['signInWithCredentialAndPassword'], 'execute').mockResolvedValue(output);
        const result = await sut.signInWithCredential(body);
        expect(result).toEqual(output);
        expect(signinSpy).toHaveBeenCalledWith(body);
    });
});
//# sourceMappingURL=authentication.controller.spec.js.map