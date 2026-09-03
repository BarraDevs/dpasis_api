import { HttpService } from '@nestjs/axios';
import { Test } from '@nestjs/testing';
import { NfsGenerationModule } from './nfs-generation.module';

describe('NfsGenerationModule - Unit tests', () => {
  it('should configure an HTTP timeout so a hung Giss connection cannot hold the worker', async() => {
    // Arrange & Act
    const module = await Test.createTestingModule({
      imports: [NfsGenerationModule.register()],
    }).compile();

    // Assert
    expect(module.get(HttpService).axiosRef.defaults.timeout).toBe(60_000);
  });
});
