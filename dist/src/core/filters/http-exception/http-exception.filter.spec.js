"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts_jest_1 = require("@golevelup/ts-jest");
const testing_1 = require("@nestjs/testing");
const app_exception_1 = require("../app.exception");
const filter_module_1 = require("../filter.module");
const http_exception_filter_1 = require("./http-exception.filter");
describe('HttpExceptionFilter', () => {
    let sut;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            imports: [filter_module_1.FilterModule],
            providers: [http_exception_filter_1.HttpExceptionFilter],
        }).compile();
        sut = module.get(http_exception_filter_1.HttpExceptionFilter);
    });
    it('should be defined', () => {
        expect(sut).toBeDefined();
    });
    describe('catch', () => {
        it('should handle HttpException correctly', () => {
            const errorMessage = 'Invalid credentials';
            const exception = new app_exception_1.AppException(errorMessage);
            const mockRequest = (0, ts_jest_1.createMock)();
            const mockResponse = (0, ts_jest_1.createMock)();
            const host = (0, ts_jest_1.createMock)({});
            jest.spyOn(host, 'switchToHttp').mockReturnValue({
                getRequest: () => mockRequest,
                getResponse: () => mockResponse,
            });
            sut.catch(exception, host);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.status(400).json).toHaveBeenCalledWith({ message: errorMessage });
        });
        it('should sanitize sensitive fields in the request body', () => {
            const errorMessage = 'Invalid credentials';
            const exception = new app_exception_1.AppException(errorMessage);
            const mockRequest = (0, ts_jest_1.createMock)({
                body: {
                    username: 'user1',
                    password: 'secret',
                },
            });
            const mockResponse = (0, ts_jest_1.createMock)();
            const host = (0, ts_jest_1.createMock)({});
            jest.spyOn(host, 'switchToHttp').mockReturnValue({
                getRequest: () => mockRequest,
                getResponse: () => mockResponse,
            });
            sut.catch(exception, host);
            expect(sut['sanitizeBody'](mockRequest.body)).toEqual({
                username: 'user1',
                password: '****',
            });
        });
        it('should handle array bodies and sanitize sensitive fields', () => {
            const errorMessage = 'Invalid credentials';
            const exception = new app_exception_1.AppException(errorMessage);
            const mockRequest = (0, ts_jest_1.createMock)({
                body: [
                    { username: 'user1', password: 'secret1' },
                    { username: 'user2', password: 'secret2' },
                ],
            });
            const mockResponse = (0, ts_jest_1.createMock)();
            const host = (0, ts_jest_1.createMock)({});
            jest.spyOn(host, 'switchToHttp').mockReturnValue({
                getRequest: () => mockRequest,
                getResponse: () => mockResponse,
            });
            sut.catch(exception, host);
            expect(sut['sanitizeBody'](mockRequest.body)).toEqual([
                { username: 'user1', password: '****' },
                { username: 'user2', password: '****' },
            ]);
        });
        it('should handle nested objects and sanitize sensitive fields', () => {
            const errorMessage = 'Invalid credentials';
            const exception = new app_exception_1.AppException(errorMessage);
            const mockRequest = (0, ts_jest_1.createMock)({
                body: {
                    user: {
                        username: 'user1',
                        password: 'secret',
                        profile: {
                            email: 'user1@example.com',
                            password: 'nestedSecret',
                        },
                    },
                },
            });
            const mockResponse = (0, ts_jest_1.createMock)();
            const host = (0, ts_jest_1.createMock)({});
            jest.spyOn(host, 'switchToHttp').mockReturnValue({
                getRequest: () => mockRequest,
                getResponse: () => mockResponse,
            });
            sut.catch(exception, host);
            expect(sut['sanitizeBody'](mockRequest.body)).toEqual({
                user: {
                    username: 'user1',
                    password: '****',
                    profile: {
                        email: 'user1@example.com',
                        password: '****',
                    },
                },
            });
        });
        it('should return the original body if there are no sensitive fields', () => {
            const errorMessage = 'Invalid credentials';
            const exception = new app_exception_1.AppException(errorMessage);
            const mockRequest = (0, ts_jest_1.createMock)({
                body: {
                    username: 'user1',
                    email: 'john@example.com',
                },
            });
            const mockResponse = (0, ts_jest_1.createMock)();
            const host = (0, ts_jest_1.createMock)({});
            jest.spyOn(host, 'switchToHttp').mockReturnValue({
                getRequest: () => mockRequest,
                getResponse: () => mockResponse,
            });
            sut.catch(exception, host);
            expect(sut['sanitizeBody'](mockRequest.body)).toEqual({
                username: 'user1',
                email: 'john@example.com',
            });
        });
        it('should call logger.error with correct parameters when not providing error code', () => {
            const errorMessage = 'Invalid credentials';
            const exception = new app_exception_1.AppException(errorMessage);
            const mockRequest = (0, ts_jest_1.createMock)({
                method: 'POST',
                url: '/login',
                body: { username: 'user1', password: 'secret' },
                params: {},
                query: {},
                user: { sub: '12345' },
            });
            const mockResponse = (0, ts_jest_1.createMock)();
            const host = (0, ts_jest_1.createMock)({});
            jest.spyOn(host, 'switchToHttp').mockReturnValue({
                getRequest: () => mockRequest,
                getResponse: () => mockResponse,
            });
            const loggerErrorSpy = jest.spyOn(sut['logger'], 'error').mockImplementation();
            sut.catch(exception, host);
            expect(loggerErrorSpy).toHaveBeenCalledWith(expect.any(String), {
                accountId: '12345',
                method: 'POST',
                url: '/login',
                body: {
                    username: 'user1',
                    password: '****',
                },
                params: {},
                query: {},
                statusCode: 400,
                error: errorMessage,
            });
        });
        it('should call logger.error with correct parameters when providing error code', () => {
            const errorMessage = 'Invalid credentials';
            const exceptionCode = 415;
            const exception = new app_exception_1.AppException(errorMessage, exceptionCode);
            const mockRequest = (0, ts_jest_1.createMock)({
                method: 'POST',
                url: '/login',
                body: { username: 'user1', password: 'secret' },
                params: {},
                query: {},
                user: { sub: '12345' },
            });
            const mockResponse = (0, ts_jest_1.createMock)();
            const host = (0, ts_jest_1.createMock)({});
            jest.spyOn(host, 'switchToHttp').mockReturnValue({
                getRequest: () => mockRequest,
                getResponse: () => mockResponse,
            });
            const loggerErrorSpy = jest.spyOn(sut['logger'], 'error').mockImplementation();
            sut.catch(exception, host);
            expect(loggerErrorSpy).toHaveBeenCalledWith(expect.any(String), {
                accountId: '12345',
                method: 'POST',
                url: '/login',
                body: {
                    username: 'user1',
                    password: '****',
                },
                params: {},
                query: {},
                statusCode: exceptionCode,
                error: errorMessage,
            });
        });
    });
});
//# sourceMappingURL=http-exception.filter.spec.js.map