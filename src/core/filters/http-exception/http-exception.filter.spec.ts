import { createMock } from '@golevelup/ts-jest';
import { ArgumentsHost } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Request, Response } from 'express';
import { AppException } from '../app.exception';
import { FilterModule } from '../filter.module';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let sut: HttpExceptionFilter;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [FilterModule],
      providers: [HttpExceptionFilter],
    }).compile();

    sut = module.get<HttpExceptionFilter>(HttpExceptionFilter);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('catch', () => {
    it('should handle HttpException correctly', () => {
      // Arrange
      const errorMessage = 'Invalid credentials';
      const exception = new AppException(errorMessage);
      const mockRequest = createMock<Request>();
      const mockResponse = createMock<Response>();
      const host = createMock<ArgumentsHost>({});

      jest.spyOn(host, 'switchToHttp').mockReturnValue({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      } as any);

      // Act
      sut.catch(exception, host);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.status(400).json).toHaveBeenCalledWith({ message: errorMessage });
    });

    it('should sanitize sensitive fields in the request body', () => {
      // Arrange
      const errorMessage = 'Invalid credentials';
      const exception = new AppException(errorMessage);
      const mockRequest = createMock<Request>({
        body: {
          username: 'user1',
          password: 'secret',
        },
      });
      const mockResponse = createMock<Response>();
      const host = createMock<ArgumentsHost>({});

      jest.spyOn(host, 'switchToHttp').mockReturnValue({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      } as any);

      // Act
      sut.catch(exception, host);

      // Assert
      expect(sut['sanitizeBody'](mockRequest.body)).toEqual({
        username: 'user1',
        password: '****',
      });
    });

    it('should handle array bodies and sanitize sensitive fields', () => {
      // Arrange
      const errorMessage = 'Invalid credentials';
      const exception = new AppException(errorMessage);
      const mockRequest = createMock<Request>({
        body: [
          { username: 'user1', password: 'secret1' },
          { username: 'user2', password: 'secret2' },
        ],
      });
      const mockResponse = createMock<Response>();
      const host = createMock<ArgumentsHost>({});

      jest.spyOn(host, 'switchToHttp').mockReturnValue({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      } as any);

      // Act
      sut.catch(exception, host);

      // Assert
      expect(sut['sanitizeBody'](mockRequest.body)).toEqual([
        { username: 'user1', password: '****' },
        { username: 'user2', password: '****' },
      ]);
    });

    it('should handle nested objects and sanitize sensitive fields', () => {
      // Arrange
      const errorMessage = 'Invalid credentials';
      const exception = new AppException(errorMessage);
      const mockRequest = createMock<Request>({
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
      const mockResponse = createMock<Response>();
      const host = createMock<ArgumentsHost>({});

      jest.spyOn(host, 'switchToHttp').mockReturnValue({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      } as any);

      // Act
      sut.catch(exception, host);

      // Assert
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
      // Arrange
      const errorMessage = 'Invalid credentials';
      const exception = new AppException(errorMessage);
      const mockRequest = createMock<Request>({
        body: {
          username: 'user1',
          email: 'john@example.com',
        },
      });
      const mockResponse = createMock<Response>();
      const host = createMock<ArgumentsHost>({});

      jest.spyOn(host, 'switchToHttp').mockReturnValue({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      } as any);

      // Act
      sut.catch(exception, host);

      // Assert
      expect(sut['sanitizeBody'](mockRequest.body)).toEqual({
        username: 'user1',
        email: 'john@example.com',
      });
    });

    it('should call logger.error with correct parameters when not providing error code', () => {
      // Arrange
      const errorMessage = 'Invalid credentials';
      const exception = new AppException(errorMessage);
      const mockRequest = createMock<Request>({
        method: 'POST',
        url: '/login',
        body: { username: 'user1', password: 'secret' },
        params: {},
        query: {},
        user: { sub: '12345' },
      });
      const mockResponse = createMock<Response>();
      const host = createMock<ArgumentsHost>({});

      jest.spyOn(host, 'switchToHttp').mockReturnValue({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      } as any);

      const loggerErrorSpy = jest.spyOn(sut['logger'], 'error').mockImplementation();

      // Act
      sut.catch(exception, host);

      // Assert
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
      // Arrange
      const errorMessage = 'Invalid credentials';
      const exceptionCode = 415;
      const exception = new AppException(errorMessage, exceptionCode);
      const mockRequest = createMock<Request>({
        method: 'POST',
        url: '/login',
        body: { username: 'user1', password: 'secret' },
        params: {},
        query: {},
        user: { sub: '12345' },
      });
      const mockResponse = createMock<Response>();
      const host = createMock<ArgumentsHost>({});

      jest.spyOn(host, 'switchToHttp').mockReturnValue({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      } as any);

      const loggerErrorSpy = jest.spyOn(sut['logger'], 'error').mockImplementation();

      // Act
      sut.catch(exception, host);

      // Assert
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
